
const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');
const { generateCriticalPath, transcribeAudio } = require('../services/gemini');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { generatePulseCard } = require('../services/graphicGenerator');
const { matchProxies } = require('../services/proxyMatcher');
const { formatStatusMessage } = require('../services/statusTracker');
const backboard = require('../services/backboard');
const elevenlabs = require('../services/elevenlabs');

// CLEANUP: removed merge conflict marker
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
  // CLEANUP: removed merge conflict marker
  try {
    const { userId, message, systemPrompt } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }
    const response = await backboard.chat(userId, message, systemPrompt);
    backboard.storeMemory(userId, `User asked: ${message}\nAssistant replied: ${response}`);
    res.json({ response });
  } catch (err) {
    console.error('Backboard AI error:', err.message);
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

// POST /api/stt — Speech-to-Text via Gemini
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

// POST /api/tts — Text-to-Speech via ElevenLabs SDK
router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const buffer = await elevenlabs.textToSpeech(text, voiceId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Content-Disposition': 'inline; filename="speech.mp3"',
    });
    res.send(buffer);
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

// GET /api/voices — list available ElevenLabs voices
router.get('/voices', async (req, res) => {
  try {
    const voices = await elevenlabs.listVoices();
    res.json({ voices });
  } catch (err) {
    console.error('Voices API error:', err.message);
    res.status(500).json({ error: 'Failed to list voices' });
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

// GET /api/proxies — get matched proxy mentors (GET variant)
router.get('/proxies', (req, res) => {
  try {
    const profile = {
      answers: [
        req.query.city || 'Toronto',
        req.query.status || 'PR',
        req.query.profession || 'Engineer',
        req.query.family || 'alone',
        req.query.concern || 'settling in'
      ]
    };
    const matches = matchProxies(profile);
    res.json({ proxies: matches });
  } catch (err) {
    console.error('Proxies API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch proxies' });
  }
});

// POST /api/status — Get status analysis
router.post('/status', async (req, res) => {
  // CLEANUP: removed merge conflict marker
  try {
    const { applicationType, monthsWaiting, type, months } = req.body;
    const appType = applicationType || type;
    const waited = monthsWaiting ?? months;
    if (!appType || waited == null) {
      return res.status(400).json({ error: 'applicationType and monthsWaiting are required' });
    }
    const msg = formatStatusMessage(appType, parseInt(waited));
    res.json({ message: msg, response: msg });
  } catch (err) {
    console.error('Status error:', err.message);
  }
});

// POST /api/onboard — submit profile, get personalized roadmap
router.post('/onboard', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'profile is required' });
    const result = await generateCriticalPath(profile);
    res.json({ tasks: result.tasks });
  } catch (err) {
    console.error('Onboard API error:', err.message);
    res.json({
      tasks: [
        { id: 'sin', title: 'Apply for your SIN', description: 'Your Social Insurance Number is required to work legally in Canada.', daysFromArrival: 1, urgency: 'critical', estimatedTime: '2-3 hours' },
        { id: 'bank', title: 'Open a Bank Account', description: 'Set up your Canadian financial foundation.', daysFromArrival: 2, urgency: 'critical', estimatedTime: '2 hours' },
        { id: 'sim', title: 'Get a SIM Card', description: 'A local phone number is vital for job applications.', daysFromArrival: 1, urgency: 'high', estimatedTime: '30 mins' },
        { id: 'health', title: 'Register for Provincial Healthcare', description: 'Register for your provincial health insurance card.', daysFromArrival: 7, urgency: 'high', estimatedTime: '1 hour' },
        { id: 'housing', title: 'Secure Long-term Housing', description: 'Move from temporary to permanent accommodation.', daysFromArrival: 14, urgency: 'medium', estimatedTime: '2-4 weeks' },
      ],
      fallback: true
    });
  }
});

// ─── BROWSER AUTOMATION ROUTES (from cloudinary-integration branch) ───────────

let playwrightBrowser;
try {
  playwrightBrowser = require('../services/playwrightBrowser');
} catch (e) {
  console.warn('⚠️ playwrightBrowser not available:', e.message);
}

const TASK_ID_MAP = {
  sin: 'apply_for_sin',
  health: 'register_health_card',
  school: 'enroll_school',
  career: 'search_career_opportunities',
  housing: 'generic_browser_research',
  bank: 'generic_browser_research',
  doctor: 'generic_browser_research',
  sim: 'generic_browser_research',
};

// POST /api/run-task — launch visible browser automation for a settlement task
router.post('/run-task', async (req, res) => {
  if (!playwrightBrowser) return res.status(501).json({ error: 'Browser automation not available' });
  const { userId, taskId, args = {} } = req.body;
  if (!userId || !taskId) return res.status(400).json({ error: 'userId and taskId are required' });

  const taskName = TASK_ID_MAP[taskId] || 'generic_browser_research';
  const taskArgs = { ...args, query: `Help with settlement task: ${taskId}` };

  res.json({ started: true, taskName });

  playwrightBrowser.run(taskName, userId, taskArgs).then(result => {
    console.log(`[Playwright] ✅ Task ${taskName} done for ${userId}`);
    global[`nc_result_${userId}`] = result;
  }).catch(err => {
    console.error(`[Playwright] ❌ Task failed:`, err.message);
    global[`nc_result_${userId}`] = `⚠️ Browser agent error: ${err.message}`;
  });
});

// POST /api/pause/:userId — pause a running browser task
router.post('/pause/:userId', async (req, res) => {
  if (!playwrightBrowser) return res.status(501).json({ error: 'Browser automation not available' });
  try {
    const result = await playwrightBrowser.pauseUserTask(req.params.userId);
    res.json({ status: 'paused', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/resume/:userId — resume a paused browser task
router.post('/resume/:userId', async (req, res) => {
  if (!playwrightBrowser) return res.status(501).json({ error: 'Browser automation not available' });
  try {
    const result = await playwrightBrowser.resumeUserTask(req.params.userId);
    res.json({ status: 'resumed', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/stop/:userId — stop a running browser task
router.post('/stop/:userId', async (req, res) => {
  if (!playwrightBrowser) return res.status(501).json({ error: 'Browser automation not available' });
  try {
    res.json({ status: 'stopped' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/answer/:userId — submit answer to a browser agent question
router.post('/answer/:userId', async (req, res) => {
  if (!playwrightBrowser) return res.status(501).json({ error: 'Browser automation not available' });
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ error: 'answer is required' });
  const consumed = playwrightBrowser.resumeWithAnswer(req.params.userId, answer);
  res.json({ consumed });
});

// GET /api/browser-status/:userId — Frontend polls for browser agent questions + results
router.get('/browser-status/:userId', (req, res) => {
  if (!playwrightBrowser) return res.status(501).json({ error: 'Browser automation not available' });
  const { userId } = req.params;
  const status = playwrightBrowser.getStatus(userId);
  const result = global[`nc_result_${userId}`];
  if (result) {
    delete global[`nc_result_${userId}`];
    return res.json({ ...status, result });
  }
  res.json(status);
});

// ─── VAPI AI PHONE ASSISTANT ────────────────────────────────────────────────
const vapi = require('../services/vapi');

// POST /api/vapi/assistant — Create or update the Vapi interview assistant
router.post('/vapi/assistant', async (req, res) => {
  // CLEANUP: removed merge conflict marker
  try {
    const assistant = await vapi.createOrUpdateAssistant();
    res.json({ assistantId: assistant.id, name: assistant.name, status: 'ready' });
  } catch (err) {
    console.error('Vapi assistant error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create Vapi assistant', detail: err.message });
  }
});

// POST /api/vapi/call — Initiate an outbound phone call
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
        break;

      case 'transcript':
        if (message.transcript?.type === 'final') {
          console.log(`🗣️ [${message.transcript.role}]: ${message.transcript.transcript}`);
        }
        break;

      case 'function-call':
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

// GET /api/user/profile?phone=+1XXXXXXXXXX — check if user has existing WhatsApp profile
router.get('/user/profile', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone is required' });

    // Check if this phone has an existing Backboard thread (i.e. they've used WhatsApp already)
    const fs = require('fs');
    const path = require('path');
    const threadMapPath = path.join(__dirname, '..', 'thread_map.json');
    let hasProfile = false;
    if (fs.existsSync(threadMapPath)) {
      const threadMap = JSON.parse(fs.readFileSync(threadMapPath, 'utf8'));
      // Twilio WhatsApp numbers are stored as "whatsapp:+1XXXXXXXXXX"
      hasProfile = !!(threadMap[`whatsapp:${phone}`] || threadMap[phone]);
    }
    res.json({ hasProfile });
  } catch (err) {
    console.error('Profile check error:', err.message);
    res.json({ hasProfile: false });
  }
});

// POST /api/user/link-phone — link WhatsApp number to Auth0 user_metadata
const auth0Manager = require('../services/auth0Manager');

router.post('/user/link-phone', async (req, res) => {
  try {
    const { phoneNumber, auth0UserId } = req.body;
    if (!phoneNumber || !auth0UserId) {
      return res.status(400).json({ error: 'phoneNumber and auth0UserId are required' });
    }

    await auth0Manager.linkWhatsAppNumber(auth0UserId, phoneNumber);

    // Also update thread_map.json to link the WhatsApp key to this Auth0 user
    const fs = require('fs');
    const path = require('path');
    const threadMapPath = path.join(__dirname, '..', 'data', 'thread_map.json');
    let map = {};
    try { map = JSON.parse(fs.readFileSync(threadMapPath, 'utf8')); } catch { }
    const key = `whatsapp:${phoneNumber}`;
    map[key] = { ...(map[key] || {}), auth0UserId };
    fs.writeFileSync(threadMapPath, JSON.stringify(map, null, 2));

    console.log(`📱 Linked WhatsApp ${phoneNumber} → Auth0 ${auth0UserId}`);
    res.json({ success: true, phoneNumber });
  } catch (err) {
    console.error('Link phone error:', err.message);
    res.status(500).json({ error: 'Failed to link phone number' });
  }
});

// POST /api/user/sync-profile — push onboarding data to Auth0 user_metadata
router.post('/user/sync-profile', async (req, res) => {
  try {
    const { auth0UserId, profile } = req.body;
    if (!auth0UserId || !profile) {
      return res.status(400).json({ error: 'auth0UserId and profile are required' });
    }

    const metadata = {
      city: profile.city || null,
      immigration_status: profile.status || null,
      profession: profile.profession || null,
      country_of_origin: profile.country || null,
      arrival_date: profile.arrivalDate || null,
      family_situation: profile.family || null,
      primary_concern: profile.concern || null,
      language: profile.language || 'English',
      critical_path_progress: 0,
      sin_obtained: false,
      ohip_registered: false,
      bank_opened: false,
      doctor_found: false,
    };

    await auth0Manager.updateSettlementProfile(auth0UserId, metadata);
    res.json({ success: true });
  } catch (err) {
    console.error('Sync profile error:', err.message);
    res.status(500).json({ error: 'Failed to sync profile' });
  }
});

// GET /api/user/settlement-profile — read Auth0 user_metadata for dashboard
router.get('/user/settlement-profile', async (req, res) => {
  try {
    const { auth0UserId } = req.query;
    if (!auth0UserId) return res.status(400).json({ error: 'auth0UserId is required' });

    const profile = await auth0Manager.getSettlementProfile(auth0UserId);
    res.json({ profile });
  } catch (err) {
    console.error('Get settlement profile error:', err.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// POST /api/user/update-task — mark a settlement task as complete
router.post('/user/update-task', async (req, res) => {
  try {
    const { auth0UserId, taskId, completed } = req.body;
    if (!auth0UserId || !taskId) {
      return res.status(400).json({ error: 'auth0UserId and taskId are required' });
    }

    const TASK_FIELD_MAP = {
      sin: 'sin_obtained',
      health: 'ohip_registered',
      bank: 'bank_opened',
      doctor: 'doctor_found',
    };

    const field = TASK_FIELD_MAP[taskId];
    if (field) {
      await auth0Manager.updateProfileField(auth0UserId, field, completed !== false);
    }

    const profile = await auth0Manager.getSettlementProfile(auth0UserId);
    const current = profile.critical_path_progress || 0;
    await auth0Manager.updateProfileField(auth0UserId, 'critical_path_progress', current + 1);

    res.json({ success: true });
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// POST /api/user/unblock — restore a blocked Auth0 account from the dashboard
router.post('/user/unblock', async (req, res) => {
  try {
    const { auth0UserId } = req.body;
    if (!auth0UserId) {
      return res.status(400).json({ error: 'auth0UserId is required' });
    }
    await auth0Manager.unblockUser(auth0UserId);
    res.json({ success: true, message: 'Account restored successfully' });
  } catch (err) {
    console.error('Unblock error:', err.message);
    res.status(500).json({ error: 'Failed to restore account' });
  }
});

module.exports = router;

