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

