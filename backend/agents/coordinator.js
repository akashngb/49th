const { generateCriticalPath, chat, generateNextQuestion } = require('../services/gemini');
const { formatStatusMessage } = require('../services/statusTracker');
const { formatProxyMessage } = require('../services/proxyMatcher');

// Per-user sessions: tracks onboarding state and full conversation history
const sessions = {};

const ONBOARDING_TOPICS = [
  "City of landing and date of arrival in Canada",
  "Immigration status (e.g. study permit, work permit, PR, visitor)",
  "Professional background or current job",
  "Arriving with family or alone?",
  "Biggest worry or top priority right now"
];

async function handle(userId, message) {
  const isCallIntent = message.toLowerCase().includes('call me') ||
    message.toLowerCase().includes('call now') ||
    message.toLowerCase().includes('phone');

  // New user — start onboarding (unless they immediately ask for a call)
  if (!sessions[userId]) {
    sessions[userId] = {
      stage: isCallIntent ? 'active' : 'onboarding',
      questionIndex: 0,
      profile: {},
      answers: [],
      qaPairs: [], // Keep track of Question -> Answer for Gemini context
      history: [] // Gemini conversation history for active stage
    };

    if (!isCallIntent) {
      const welcomeMsg = "Welcome to Roots 🌱\n\nI help newcomers to Canada figure out exactly what to do — and in what order. Let's start with a few quick questions.\n\nFirst: where did you arrive from, and when did you land in Canada?";
      sessions[userId].lastAskedQuestion = "where did you arrive from, and when did you land in Canada?";
      return welcomeMsg;
    }
  }

  const session = sessions[userId];

  // Force active stage if they ask for a call mid-onboarding
  if (isCallIntent) {
    session.stage = 'active';
  }

  // PROXY shortcut
  if (message.trim().toUpperCase() === 'PROXY' || message.trim().toUpperCase() === 'MORE') {
    return formatProxyMessage(session.profile);
  }

  // STATUS shortcut
  if (message.trim().toUpperCase() === 'STATUS' && session.stage !== 'status_q1' && session.stage !== 'status_q2') {
    session.stage = 'status_q1';
    return "To check your application timeline, what type of application did you submit?\n\n(e.g. PR - Express Entry, Work Permit, Study Permit, PR - Spousal)";
  }

  if (session.stage === 'status_q1') {
    session.statusType = message;
    session.stage = 'status_q2';
    return "How many months have you been waiting since you submitted your application?";
  }

  if (session.stage === 'status_q2') {
    const months = parseInt(message);
    session.stage = 'active';
    return formatStatusMessage(session.statusType, months);
  }

  // ONBOARDING flow — collect answers and generate the next natural question
  if (session.stage === 'onboarding') {
    session.answers.push(message);

    // Save the Q&A context for Gemini to read
    const q = session.lastAskedQuestion || ONBOARDING_TOPICS[0];
    session.qaPairs.push(`Question: ${q}\nAnswer: ${message}`);

    session.questionIndex++;

    if (session.questionIndex < ONBOARDING_TOPICS.length) {
      const targetTopic = ONBOARDING_TOPICS[session.questionIndex];
      try {
        const nextQuestion = await generateNextQuestion(session.qaPairs, targetTopic);
        session.lastAskedQuestion = nextQuestion;
        return nextQuestion;
      } catch (err) {
        // Fallback to simpler literal topic phrasing if Gemini fails temporarily
        console.error("Gemini dynamic question error:", err.message);
        return `Got it. Now, what about your ${targetTopic}?`;
      }
    }

    // Onboarding complete — build profile and generate Gemini critical path
    session.stage = 'active';
    session.profile = {
      answers: session.answers,
      qaPairs: session.qaPairs,
      questions: ONBOARDING_TOPICS
    };

    try {
      const path = await generateCriticalPath(session.profile);
      const tasks = path.tasks.slice(0, 5);
      let response = "Here's your critical path for the next 90 days 🗺️\n\n";
      tasks.forEach((task, i) => {
        const emoji = task.urgency === 'critical' ? '🔴' : task.urgency === 'high' ? '🟡' : '🟢';
        response += `${emoji} *${i + 1}. ${task.title}*\n${task.description}\n⏱ ${task.estimatedTime}\n\n`;
      });
      response += "Type *PROXY* to hear from people who made your exact move, or *STATUS* to check your application timeline.\n\nOr just ask me anything — I'm here to help 🌱";

      // Seed Gemini history so it has context about this user
      const profileSummary = session.qaPairs.join('\n\n');
      session.history.push({ role: 'user', text: `My profile:\n${profileSummary}` });
      session.history.push({ role: 'model', text: response });

      return response;
    } catch (err) {
      console.error('Gemini critical path error:', err.response?.data || err.message);
      return "Welcome! I've set up your profile. Ask me anything about settling in Canada — banking, SIN, health card, housing, jobs, and more 🌱\n\nType *STATUS* to check your application timeline.";
    }
  }

  // ACTIVE stage — Gemini is the full brain for all messages
  try {
    const profileContext = session.profile.qaPairs
      ? `The user's background:\n${session.profile.qaPairs.join('\n')}`
      : '';

    const systemPrompt = `You are Roots 🌱, a warm AI companion for newcomers to Canada.
Help with immigration, settlement, banking, housing, healthcare, jobs, and community.
${profileContext}
CRITICAL: Respond in the same language the user uses. Be concise (2-3 paragraphs max).
At the end of responses, suggest: Type *STATUS* to check your application timeline or *PROXY* to connect with others who made your move.
If your answer discusses immigration application processing times, approval rates, or general statistics, you MUST append exactly this text at the very end of your answer: [GRAPHIC]`;

    let reply = await chat(message, session.history, systemPrompt, userId);

    // Keep rolling history (last 10 turns to avoid token limits)
    session.history.push({ role: 'user', text: message });
    session.history.push({ role: 'model', text: reply });
    if (session.history.length > 20) session.history = session.history.slice(-20);

    let mediaUrl = null;

    // Generate graphics contextually based on Gemini's output
    if (reply.includes('[GRAPHIC]')) {
      reply = reply.replace('[GRAPHIC]', '').trim();
      try {
        const { generatePulseCard } = require('../services/graphicGenerator');
        const appType = session.statusType || 'Work Permit';
        console.log('🎨 Generating Contextual Pulse Card for active chat (Type:', appType, ')');
        mediaUrl = await generatePulseCard('applicationBreakdown', { applicationType: appType });
      } catch (err) {
        console.error('Failed to generate automatic graphic:', err.message);
      }
    }

    return mediaUrl ? { text: reply, mediaUrl } : reply;
  } catch (err) {
    console.error('Gemini chat error:', err.response?.data || err.message);
    return "I'm here to help 🌱\n\nType:\n*STATUS* — check your application timeline\n*PROXY* — hear from people who made your exact move\n\nOr just ask me anything about settling in Canada.";
  }
}

module.exports = { handle };