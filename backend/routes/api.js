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
const playwrightBrowser = require('../services/playwrightBrowser');

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

// New endpoint: pause a running browser task for a user
router.post('/pause/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await playwrightBrowser.pauseUserTask(userId);
    res.json({ status: 'paused', result });
  } catch (e) {
    console.error('Pause API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// New endpoint: resume a paused browser task for a user
router.post('/resume/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await playwrightBrowser.resumeUserTask(userId);
    res.json({ status: 'resumed', result });
  } catch (e) {
    console.error('Resume API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
// Map settlement task IDs to nanoclaw/playwright task names
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

// POST /api/run-task — launch a visible browser automation for a settlement task
router.post('/run-task', async (req, res) => {
  const { userId, taskId, args = {} } = req.body;
  if (!userId || !taskId) return res.status(400).json({ error: 'userId and taskId are required' });

  const taskName = TASK_ID_MAP[taskId] || 'generic_browser_research';
  const taskArgs = { ...args, query: `Help with settlement task: ${taskId}` };

  // Fire and forget — browser opens on screen, result polled via /browser-status
  res.json({ started: true, taskName });

  playwrightBrowser.run(taskName, userId, taskArgs).then(result => {
    console.log(`[Playwright] ✅ Task ${taskName} done for ${userId}`);
    global[`nc_result_${userId}`] = result;
  }).catch(err => {
    console.error(`[Playwright] ❌ Task failed:`, err.message);
    global[`nc_result_${userId}`] = `⚠️ Browser agent error: ${err.message}`;
  });
});

// POST /api/stop/:userId — stop a running browser task
router.post('/stop/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const session = playwrightBrowser.getStatus(userId);
    if (session && session.active) {
      // Set the stopped flag on the page
      const activeSession = playwrightBrowser.getSession ? playwrightBrowser.getSession(userId) : null;
      if (activeSession && activeSession.page) {
        await activeSession.page.evaluate(() => { window.__roots_stopped = true; });
      }
    }
    res.json({ status: 'stopped' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/answer/:userId — submit answer to a browser agent question
router.post('/answer/:userId', async (req, res) => {
  const { userId } = req.params;
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ error: 'answer is required' });
  const consumed = playwrightBrowser.resumeWithAnswer(userId, answer);
  res.json({ consumed });
});

// POST /api/chat (original coordinator route)
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


// POST /api/ai/chat — Backboard for chat + NanoClaw for browser tasks
router.post('/ai/chat', async (req, res) => {
  try {
    const { userId, message, systemPrompt } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const { detectBrowserIntent, runBrowserTask } = require('../services/nanoclaw');
    const pendingKey = `nc_pending_${userId}`;

    // Check if this is a "YES" confirming a pending browser task
    if (global[pendingKey] && message.trim().toUpperCase() === 'YES') {
      const { taskName, args } = global[pendingKey];
      delete global[pendingKey];

      res.json({ response: `Browser Agent Activated. Opening Chrome now. I will message you here if I need any information.` });

      // Launch visible Playwright browser in the background
      playwrightBrowser.run(taskName, userId, args).then(result => {
        console.log(`[Playwright] ✅ Task ${taskName} done for ${userId}`);
        backboard.storeMemory(userId, `Browser automation completed: ${taskName}. Result: ${result}`);
        // Store final result so frontend can pick it up via polling
        global[`nc_result_${userId}`] = result;
      }).catch(err => {
        console.error(`[Playwright] ❌ Task failed:`, err.message);
        global[`nc_result_${userId}`] = `Browser agent encountered an error: ${err.message}`;
      });

      return;
    }

    // Check if user is answering a browser agent question
    if (playwrightBrowser.resumeWithAnswer(userId, message)) {
      // Message was consumed by the browser agent — just acknowledge
      return res.json({ response: `Information received. Resuming automation.` });
    }

    // Detect browser intent from user message BEFORE calling Backboard
    const browserIntent = detectBrowserIntent(message);

    // Normal Backboard chat
    const response = await backboard.chat(userId, message, systemPrompt);

    // Persist conversation in Backboard memory
    backboard.storeMemory(userId, `User: ${message}\nAssistant: ${response}`);

    // If browser intent detected, store pending task and append the offer
    if (browserIntent) {
      global[pendingKey] = {
        taskName: browserIntent,
        args: {
          fullName: extractName(message),
          province: extractProvince(message),
          query: message
        }
      };
      const permissionMsg = `\n\n---\nI can automate this process for you via the browser agent. Type YES to start.`;
      return res.json({ response: response + permissionMsg });
    }

    res.json({ response });
  } catch (err) {
    console.error('AI chat error:', err.message);
    try {
      const fallback = await coordinator.handle(req.body.userId, req.body.message);
      res.json({ response: fallback, source: 'fallback' });
    } catch {
      res.status(500).json({ error: 'AI services unavailable' });
    }
  }
});

// GET /api/browser-status/:userId — Frontend polls this to get browser agent questions + results
router.get('/browser-status/:userId', (req, res) => {
  const { userId } = req.params;
  const status = playwrightBrowser.getStatus(userId);
  const result = global[`nc_result_${userId}`];

  // If a final result is ready, send it once and clear
  if (result) {
    delete global[`nc_result_${userId}`];
    return res.json({ ...status, result });
  }

  res.json(status);
});


// Helper: extract name from message
function extractName(message) {
  const match = message.match(/(?:my name is|i am|i'm)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i);
  return match ? match[1] : undefined;
}

// Helper: extract province from message
function extractProvince(message) {
  const provinces = ['ontario', 'british columbia', 'bc', 'alberta', 'quebec', 'manitoba', 'saskatchewan', 'nova scotia', 'new brunswick', 'newfoundland', 'pei'];
  const lower = message.toLowerCase();
  return provinces.find(p => lower.includes(p));
}




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

module.exports = router;

