const { generateCriticalPath } = require('../services/gemini');
const { formatStatusMessage } = require('../services/statusTracker');
const { formatProxyMessage } = require('../services/proxyMatcher');
const { chat, saveUserProfile, loadUserData } = require('../services/backboard');
const auth0Manager = require('../services/auth0Manager');

const sessions = {};

const ONBOARDING_QUESTIONS = [
  "What is your full name?",
  "Which country are you originally from?",
  "What language do you prefer to communicate in? (e.g. English, French, Spanish, Hindi, Urdu, Tagalog, Ukrainian)",
  "Which province are you settling in? (e.g. Ontario, British Columbia, Alberta, Quebec)",
  "Which city did you land in?",
  "When did you arrive in Canada? (e.g. January 2025)",
  "What is your immigration status? (e.g. Permanent Resident, Work Permit, Study Permit, Refugee Claimant, Citizen)",
  "What is your profession?",
  "What is your highest level of education? (e.g. High School, Bachelor's, Master's, PhD, Trade Certificate)",
  "What is your marital status, and do you have children with you? (e.g. Single, Married with 2 kids)",
  "What is your biggest concern right now as you settle in Canada?"
];

const ROOTS_SYSTEM_PROMPT = `You are Roots 🌱, a warm and knowledgeable AI companion for newcomers to Canada built by 49th. You help immigrants navigate settlement — documents, healthcare, SIN, OHIP, banking, career, and community.

You already know this user's profile from onboarding. Use everything you know about them to give specific, practical advice. Never ask them to repeat information they've already given.

CRITICAL: Always respond in the same language the user writes in. If they write in French, respond in French. If Spanish, respond in Spanish.

Keep responses concise and actionable. Use WhatsApp formatting: *bold* for important terms, line breaks for readability. End with a helpful next step or question.`;

async function handle(userId, message) {

  // ── SECURITY INTERCEPT ──────────────────────────────────────────
  if (message.trim().toUpperCase() === 'SECURE') {
    const saved = loadUserData(userId);
    if (saved?.auth0UserId) {
      try {
        const { blockUser } = require('../services/auth0Manager');
        await blockUser(saved.auth0UserId);
        return `🔒 *Your 49th account has been secured.*\n\nYour dashboard login has been disabled immediately. Your settlement data is safe.\n\nTo restore access, reply *RESTORE* or contact us directly.`;
      } catch (err) {
        console.error('[Security] Failed to block user:', err.message);
        return `⚠️ We received your security request but had trouble locking your account. Please try again in a moment.`;
      }
    } else {
      return `🔒 *Security alert received.*\n\nWe don't have a linked dashboard account for this number yet. If you believe your account is compromised, please contact us immediately.`;
    }
  }
  // ── END SECURITY INTERCEPT ──────────────────────────────────────

  // ── RESTORE INTERCEPT ───────────────────────────────────────────
  if (message.trim().toUpperCase() === 'RESTORE') {
    const saved = loadUserData(userId);
    if (saved?.auth0UserId) {
      try {
        const { unblockUser } = require('../services/auth0Manager');
        await unblockUser(saved.auth0UserId);
        return `🔓 *Your 49th account has been restored.*\n\nYou can now log back into your dashboard at 49th.ca.\n\nIf you did not request this, reply *SECURE* immediately.`;
      } catch (err) {
        console.error('[Security] Failed to unblock user:', err.message);
        return `⚠️ We had trouble restoring your account. Please try again or contact us directly.`;
      }
    } else {
      return `We couldn't find a linked account for this number. Please log in at 49th.ca directly.`;
    }
  }
  // ── END RESTORE INTERCEPT ───────────────────────────────────────

  // Restore from disk if server restarted
  if (!sessions[userId]) {
    const saved = loadUserData(userId);
    if (saved?.stage === 'active') {
      sessions[userId] = {
        stage: 'active',
        profile: saved.profile || {},
        answers: [],
        questionIndex: ONBOARDING_QUESTIONS.length
      };
    }
  }

  // Task 1 — If still no session, check if this WhatsApp number is linked to an Auth0 profile
  if (!sessions[userId]) {
    const saved = loadUserData(userId);
    const auth0UserId = saved?.auth0UserId || null;

    if (auth0UserId) {
      try {
        const meta = await auth0Manager.getSettlementProfile(auth0UserId);

        // Only skip onboarding if the profile has meaningful data
        if (meta?.city && meta?.immigration_status) {
          const profile = {
            name: meta.name || null,
            country: meta.country_of_origin || null,
            language: meta.language || 'English',
            province: meta.province || null,
            city: meta.city,
            arrivalDate: meta.arrival_date || null,
            status: meta.immigration_status,
            profession: meta.profession || null,
            education: meta.education || null,
            family: meta.family_situation || null,
            concern: meta.primary_concern || null,
          };

          // Create session in active stage with their existing profile
          sessions[userId] = {
            stage: 'active',
            profile: {
              answers: Object.values(profile),
              questions: Object.keys(profile)
            },
            answers: Object.values(profile),
            questionIndex: ONBOARDING_QUESTIONS.length
          };

          // Save to disk so it persists
          saveUserProfile(userId, profile, 'active');

          // Build context injection for Backboard — primes the thread silently
          const completedTasks = [];
          if (meta.sin_obtained) completedTasks.push('SIN obtained');
          if (meta.ohip_registered) completedTasks.push('OHIP registered');
          if (meta.bank_opened) completedTasks.push('Bank account opened');
          if (meta.doctor_found) completedTasks.push('Family doctor found');

          const contextMessage = `[SYSTEM CONTEXT — DO NOT REPEAT THIS TO THE USER]
This user completed onboarding on the 49th web dashboard. Here is their full profile:
- Name: ${profile.name || 'not provided'}
- From: ${profile.country || 'not provided'}
- Preferred language: ${profile.language}
- Province: ${profile.province || 'not provided'}
- City: ${profile.city}
- Arrived: ${profile.arrivalDate || 'not provided'}
- Immigration status: ${profile.status}
- Profession: ${profile.profession || 'not provided'}
- Family: ${profile.family || 'not provided'}
- Primary concern: ${profile.concern || 'not provided'}
- Tasks already completed: ${completedTasks.length > 0 ? completedTasks.join(', ') : 'none yet'}

Greet them warmly by first name if available. Do not ask for any information already provided above. Pick up exactly where their settlement journey is — suggest the most urgent next task based on their profile and what's already done.`;

          // Prime the Backboard thread with context silently, then respond to actual message
          await chat(userId, contextMessage, ROOTS_SYSTEM_PROMPT);
          const response = await chat(userId, message, ROOTS_SYSTEM_PROMPT);
          return response;
        }
      } catch (err) {
        console.error('[Coordinator] Auth0 profile lookup failed, falling back to onboarding:', err.message);
        // Fall through to normal onboarding
      }
    }
  }

  if (!sessions[userId]) {
    sessions[userId] = {
      stage: 'onboarding',
      questionIndex: 0,
      profile: {},
      answers: []
    };
    return "Welcome to Roots 🌱\n\nI help newcomers to Canada navigate their settlement journey — from documents and healthcare to career and community.\n\nLet's start with a few quick questions so I can build your personal roadmap.\n\nFirst: What is your full name?";
  }

  const session = sessions[userId];

  // PROXY flow
  if (message.trim().toUpperCase() === 'PROXY' || message.trim().toUpperCase() === 'MORE') {
    return formatProxyMessage(session.profile);
  }

  // STATUS flow
  if (message.trim().toUpperCase() === 'STATUS') {
    session.stage = 'status_q1';
    return "To check your application timeline, what type of application did you submit?\n\n(e.g. PR - Express Entry, Work Permit, Study Permit, PR - Spousal)";
  }

  if (session.stage === 'status_q1') {
    session.statusType = message;
    session.stage = 'status_q2';
    return "How many months ago did you submit your application?";
  }

  if (session.stage === 'status_q2') {
    const months = parseInt(message);
    session.stage = 'active';
    return formatStatusMessage(session.statusType, months);
  }

  // ONBOARDING flow
  if (session.stage === 'onboarding') {
    session.answers.push(message);
    session.questionIndex++;

    if (session.questionIndex < ONBOARDING_QUESTIONS.length) {
      return ONBOARDING_QUESTIONS[session.questionIndex];
    }

    session.stage = 'active';
    session.profile = {
      answers: session.answers,
      questions: ONBOARDING_QUESTIONS
    };

    // Persist full profile to disk so it survives restarts
    const profileForDisk = {
      name: session.answers[0],
      country: session.answers[1],
      language: session.answers[2],
      province: session.answers[3],
      city: session.answers[4],
      arrivalDate: session.answers[5],
      status: session.answers[6],
      profession: session.answers[7],
      education: session.answers[8],
      family: session.answers[9],
      concern: session.answers[10]
    };
    saveUserProfile(userId, profileForDisk, 'active');

    // Task 2 — Preserve auth0UserId link if this number was linked from the web app
    const existingData = loadUserData(userId);
    if (existingData?.auth0UserId) {
      const fs = require('fs');
      const path = require('path');
      const threadMapPath = path.join(__dirname, '../data/thread_map.json');
      try {
        const parsed = JSON.parse(fs.readFileSync(threadMapPath, 'utf8'));
        if (parsed[userId]) {
          parsed[userId].auth0UserId = existingData.auth0UserId;
          fs.writeFileSync(threadMapPath, JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        console.error('[Coordinator] Failed to preserve auth0UserId:', e.message);
      }
    }

    try {
      const path = await generateCriticalPath(session.profile);
      const tasks = path.tasks.slice(0, 5);
      let response = "Here's your critical path for the next 90 days 🗺️\n\n";
      tasks.forEach((task, i) => {
        const emoji = task.urgency === 'critical' ? '🔴' : task.urgency === 'high' ? '🟡' : '🟢';
        response += `${emoji} *${i + 1}. ${task.title}*\n${task.description}\n⏱ ${task.estimatedTime}\n\n`;
      });
      response += "Type *PROXY* to hear from people who made your exact move, or *STATUS* to check your application timeline.";
      return response;
    } catch (err) {
      console.error('Gemini error:', err.response?.data || err.message);
      return "Here's your critical path — your next steps are: SIN application, bank account, and healthcare registration. Type *STATUS* to check any application timeline.";
    }
  }

  // ACTIVE stage — route through Backboard with profile context
  if (session.stage === 'active') {
    const profileContext = session.profile?.answers
      ? `[User profile: ${session.profile.questions.map((q, i) => `${q}: ${session.profile.answers[i]}`).join(' | ')}]`
      : '';

    const fullMessage = profileContext
      ? `${profileContext}\n\nUser says: ${message}`
      : message;

    try {
      const response = await chat(userId, fullMessage, ROOTS_SYSTEM_PROMPT);

      // Task 3 — Detect task completion keywords and sync back to Auth0
      const saved = loadUserData(userId);
      if (saved?.auth0UserId) {
        const lower = message.toLowerCase();
        const TASK_KEYWORDS = {
          sin: ['got my sin', 'sin number', 'received my sin', 'applied for sin', 'sin done', 'got sin'],
          health: ['got ohip', 'health card', 'ohip card', 'registered for ohip', 'ohip done'],
          bank: ['opened account', 'bank account', 'got my bank', 'banking done', 'opened a bank'],
          doctor: ['found a doctor', 'family doctor', 'got a doctor', 'registered with doctor'],
        };
        const FIELD_MAP = { sin: 'sin_obtained', health: 'ohip_registered', bank: 'bank_opened', doctor: 'doctor_found' };

        for (const [taskId, keywords] of Object.entries(TASK_KEYWORDS)) {
          if (keywords.some(kw => lower.includes(kw))) {
            auth0Manager.updateProfileField(saved.auth0UserId, FIELD_MAP[taskId], true)
              .catch(err => console.error('[Coordinator] Auth0 task update failed:', err.message));
            break;
          }
        }
      }

      return response;
    } catch (err) {
      console.error('Backboard chat error:', err.message);
      return "I'm having trouble connecting right now. Please try again in a moment 🌱";
    }
  }
}

module.exports = { handle };