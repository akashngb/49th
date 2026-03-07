const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');
const { generateCriticalPath, transcribeAudio } = require('../services/gemini');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
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
    const response = await coordinator.handle(userId, message);
    res.json({ response });
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
      const fallback = await coordinator.handle(req.body.userId, req.body.message);
      res.json({ response: fallback, source: 'fallback' });
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
    const text = await transcribeAudio(req.file.buffer, req.file.mimetype);
    console.log('📝 STT Transcription:', text);
    res.json({ text });
  } catch (err) {
    console.error('❌ STT API error:', err.message);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// POST /api/tts — ElevenLabs text-to-speech
router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const audioBuffer = await elevenlabs.textToSpeech(text, voiceId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': 'inline; filename="speech.mp3"',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS API error:', err.message);
    res.status(500).json({ error: 'Failed to generate speech' });
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

// POST /api/onboard — submit profile, get personalized roadmap
router.post('/onboard', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: 'profile is required' });
    }
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

// GET /api/proxies — get matched proxy mentors
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

// POST /api/status — check application status
router.post('/status', (req, res) => {
  try {
    const { type, months } = req.body;
    if (!type || months === undefined) {
      return res.status(400).json({ error: 'type and months are required' });
    }
    const response = formatStatusMessage(type, parseInt(months));
    res.json({ response });
  } catch (err) {
    console.error('Status API error:', err.message);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// POST /api/user/link-phone — store a user's WhatsApp phone number
router.post('/user/link-phone', (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }
    // TODO: persist to database — for now acknowledge success
    console.log(`📱 Linked WhatsApp number: ${phoneNumber}`);
    res.json({ success: true, phoneNumber });
  } catch (err) {
    console.error('Link phone error:', err.message);
    res.status(500).json({ error: 'Failed to link phone number' });
  }
});

module.exports = router;
