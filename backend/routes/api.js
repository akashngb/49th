const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');
const { generateCriticalPath, transcribeAudio } = require('../services/gemini');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { generatePulseCard } = require('../services/graphicGenerator');

// POST /api/graphic — Generate a statistics/graph image and return Cloudinary URL
router.post('/graphic', async (req, res) => {
    try {
        const { type, options } = req.body;
        if (!type || !options) return res.status(400).json({ error: 'type and options are required' });
        const url = await generatePulseCard(type, options);
        res.json({ url });
    } catch (err) {
        console.error('Graphic error:', err.message);
        res.status(500).json({ error: 'Failed to generate graphic' });
    }
});
const { matchProxies } = require('../services/proxyMatcher');
const { formatStatusMessage } = require('../services/statusTracker');
const backboard = require('../services/backboard');
const elevenlabs = require('../services/elevenlabs');

// POST /api/chat — send a message to the AI coordinator
router.post('/chat', async (req, res) => {
    try {
        const { userId, message } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ error: 'userId and message are required' });
        }
        let rawResponse = await coordinator.handle(userId, message);
        const response = typeof rawResponse === 'string' ? rawResponse : rawResponse.text;
        const mediaUrl = typeof rawResponse === 'object' ? rawResponse.mediaUrl : null;
        res.json({ response, mediaUrl });
    } catch (err) {
        console.error('Chat API error:', err.message);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// POST /api/ai/chat — Backboard AI chat with persistent memory
router.post('/ai/chat', async (req, res) => {
    try {
        const { userId, message, systemPrompt } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ error: 'userId and message are required' });
        }
        const response = await backboard.chat(userId, message, systemPrompt);

        // Store the conversation context in Backboard memory
        backboard.storeMemory(userId, `User asked: ${message}\nAssistant replied: ${response}`);

        res.json({ response });
    } catch (err) {
        console.error('Backboard AI error:', err.message);
        // Fallback to coordinator if Backboard is unavailable
        try {
            let fallbackRaw = await coordinator.handle(req.body.userId, req.body.message);
            const fallback = typeof fallbackRaw === 'string' ? fallbackRaw : fallbackRaw.text;
            const mediaUrl = typeof fallbackRaw === 'object' ? fallbackRaw.mediaUrl : null;
            res.json({ response: fallback, mediaUrl, source: 'fallback' });
        } catch {
            res.status(500).json({ error: 'AI services unavailable' });
        }
    }
});

// POST /api/stt — Speech-to-Text
router.post('/stt', upload.single('audio'), async (req, res) => {
    try {
        console.log('🎙️ STT Request received');
        if (!req.file) {
            console.error('❌ STT: No audio file in request');
            return res.status(400).json({ error: 'No audio file provided' });
        }
        console.log(`📏 STT: Received file ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);
        const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
        res.json({ transcript });
    } catch (err) {
        console.error('STT error:', err.message);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

// POST /api/tts — Text-to-Speech
router.post('/tts', async (req, res) => {
    try {
        const { text, voiceId } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        const buffer = await elevenlabs.textToSpeech(text, voiceId);
        res.set('Content-Type', 'audio/mpeg');
        res.send(buffer);
    } catch (err) {
        console.error('TTS error:', err.message);
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

// POST /api/proxy — Get proxy matches
router.post('/proxy', async (req, res) => {
    try {
        const { profile } = req.body;
        if (!profile) return res.status(400).json({ error: 'Profile is required' });
        const matches = matchProxies(profile);
        res.json({ matches });
    } catch (err) {
        console.error('Proxy error:', err.message);
        res.status(500).json({ error: 'Failed to match proxies' });
    }
});

// POST /api/status — Get status analysis
router.post('/status', async (req, res) => {
    try {
        const { applicationType, monthsWaiting } = req.body;
        if (!applicationType || monthsWaiting == null) {
            return res.status(400).json({ error: 'applicationType and monthsWaiting are required' });
        }
        const msg = formatStatusMessage(applicationType, monthsWaiting);
        res.json({ message: msg });
    } catch (err) {
        console.error('Status error:', err.message);
        res.status(500).json({ error: 'Failed to analyze status' });
    }
});

// ─── VAPI AI PHONE ASSISTANT ────────────────────────────────────────────────
const vapi = require('../services/vapi');

// POST /api/vapi/assistant — Create or update the Vapi interview assistant
router.post('/vapi/assistant', async (req, res) => {
    try {
        const assistant = await vapi.createOrUpdateAssistant();
        res.json({ assistantId: assistant.id, name: assistant.name, status: 'ready' });
    } catch (err) {
        console.error('Vapi assistant error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to create Vapi assistant', detail: err.message });
    }
});

// POST /api/vapi/call — Initiate an outbound phone call
// Body: { phoneNumber: "+14155551234", phoneNumberId: "vapi_phone_id" }
router.post('/vapi/call', async (req, res) => {
    try {
        const { phoneNumber, assistantId, phoneNumberId } = req.body;
        if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required (E.164 format, e.g. +14155551234)' });

        const aid = assistantId || process.env.VAPI_ASSISTANT_ID;
        if (!aid) return res.status(400).json({ error: 'assistantId is required (or set VAPI_ASSISTANT_ID in .env)' });

        const pid = phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID;
        if (!pid) return res.status(400).json({ error: 'phoneNumberId is required (or set VAPI_PHONE_NUMBER_ID in .env)' });

        const call = await vapi.makeCall(phoneNumber, aid, pid);
        res.json({ callId: call.id, status: call.status, phoneNumber });
    } catch (err) {
        console.error('Vapi call error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to initiate call', detail: err.message });
    }
});

// GET /api/vapi/call/:callId — Get call status and transcript
router.get('/vapi/call/:callId', async (req, res) => {
    try {
        const call = await vapi.getCallStatus(req.params.callId);
        res.json({
            callId: call.id,
            status: call.status,
            duration: call.endedAt && call.startedAt
                ? Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000)
                : null,
            transcript: call.transcript || null,
            summary: call.summary || null,
            endedReason: call.endedReason || null
        });
    } catch (err) {
        console.error('Vapi call status error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to get call status', detail: err.message });
    }
});

// GET /api/vapi/calls — List recent calls
router.get('/vapi/calls', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const calls = await vapi.listCalls(limit);
        res.json({ calls });
    } catch (err) {
        console.error('Vapi list calls error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to list calls', detail: err.message });
    }
});

// POST /api/vapi/webhook — Receive real-time events from Vapi
// Configure this URL in your Vapi dashboard: https://yourserver.com/api/vapi/webhook
router.post('/vapi/webhook', async (req, res) => {
    try {
        const event = req.body;
        const { message } = event;

        if (!message) return res.sendStatus(200);

        switch (message.type) {
            case 'assistant-request':
                console.log('🗣️ Vapi inbound call received! Sending Immigration Assistant configuration...');
                return res.json({
                    assistant: {
                        name: '49th Immigration Companion — Interview',
                        firstMessage: "Hi! Thanks for requesting a call. I'm your AI assistant and I have a few quick questions for you. First, may I have your name?",
                        model: {
                            provider: 'openai',
                            model: 'gpt-4o',
                            messages: [{ role: 'system', content: vapi.INTERVIEW_SYSTEM_PROMPT }]
                        },
                        voice: {
                            provider: '11labs',
                            voiceId: 'EXAVITQu4vr4xnSDxMaL',
                            stability: 0.5,
                            similarityBoost: 0.75
                        },
                        transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' }
                    }
                });

            case 'call-started':
                console.log('📞 Vapi call started:', message.call?.id);
                break;

            case 'call-ended':
                console.log('📵 Vapi call ended:', message.call?.id, '| Reason:', message.call?.endedReason);
                console.log('📝 Transcript:', message.call?.transcript || '(none)');
                // TODO: Save transcript/summary to your database or send via email/WhatsApp
                break;

            case 'transcript':
                // Real-time transcript chunks during the call
                if (message.transcript?.type === 'final') {
                    console.log(`🗣️ [${message.transcript.role}]: ${message.transcript.transcript}`);
                }
                break;

            case 'function-call':
                // Handle any custom tool calls defined on the assistant
                console.log('🔧 Vapi function call:', message.functionCall?.name);
                return res.json({ result: 'ok' });

            default:
                console.log('📡 Vapi event:', message.type);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Vapi webhook error:', err.message);
        res.sendStatus(200); // Always 200 to Vapi so it doesn't retry
    }
});

module.exports = router;

