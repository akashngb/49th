const { generateCriticalPath } = require('../services/gemini');
const { formatStatusMessage } = require('../services/statusTracker');
const { formatProxyMessage } = require('../services/proxyMatcher');
const { chat, saveUserProfile, loadUserData } = require('../services/backboard');

const sessions = {};

const ONBOARDING_QUESTIONS = [
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
  // Task 3 — restore session from disk if not in memory
  if (!sessions[userId]) {
    const saved = loadUserData(userId);
    if (saved?.stage === 'active') {
      sessions[userId] = {
        stage: 'active',
        profile: saved.profile || {},
        answers: [],
        questionIndex: 5
      };
    }
  }

  if (!sessions[userId]) {
    sessions[userId] = {
      stage: 'onboarding',
      questionIndex: 0,
      profile: {},
      answers: []
    };
    return "Welcome to Roots 🌱\n\nI help newcomers to Canada figure out exactly what to do — and in what order. Let's start with a few quick questions.\n\nFirst: where did you arrive from, and when did you land in Canada?";
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
      country: session.answers[0],
      language: session.answers[1],
      province: session.answers[2],
      city: session.answers[3],
      arrivalDate: session.answers[4],
      status: session.answers[5],
      profession: session.answers[6],
      education: session.answers[7],
      family: session.answers[8],
      concern: session.answers[9]
    };
    saveUserProfile(userId, profileForDisk, 'active');

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

  // Task 2 — ACTIVE stage: route through Backboard with profile context
  if (session.stage === 'active') {
    const profileContext = session.profile?.answers
      ? `[User profile: ${session.profile.questions.map((q, i) => `${q}: ${session.profile.answers[i]}`).join(' | ')}]`
      : '';

    const fullMessage = profileContext
      ? `${profileContext}\n\nUser says: ${message}`
      : message;

    try {
      const response = await chat(userId, fullMessage, ROOTS_SYSTEM_PROMPT);
      return response;
    } catch (err) {
      console.error('Backboard chat error:', err.message);
      return "I'm having trouble connecting right now. Please try again in a moment 🌱";
    }
  }
}

module.exports = { handle };