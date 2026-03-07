const { generateCriticalPath } = require('../services/gemini');
const { formatStatusMessage } = require('../services/statusTracker');
const { formatProxyMessage } = require('../services/proxyMatcher');

const sessions = {};

const ONBOARDING_QUESTIONS = [
  "Which city did you land in?",
  "What is your immigration status? (e.g. study permit, work permit, PR, visitor)",
  "What do you do professionally?",
  "Do you have family with you, or are you arriving alone?",
  "What are you most worried about right now?"
];

async function handle(userId, message) {
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
      return `Here's your critical path...` // hardcoded fallback
    }
  }

  // ACTIVE — general responses
  return "I'm here to help 🌱\n\nType:\n*STATUS* — check your application timeline\n*PROXY* — hear from people who made your exact move\n\nOr just ask me anything about settling in Canada.";
}

module.exports = { handle };