const axios = require('axios');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const ROOTS_SYSTEM_PROMPT = `You are Roots 🌱, a warm and knowledgeable AI companion for newcomers to Canada.
You help immigrants navigate settlement — from documents and healthcare to career and community.

CRITICAL: ALWAYS respond in the exact same language the user uses (French, Spanish, Arabic, etc.).
Be concise (1-3 short paragraphs max), practical, and empathetic.
When relevant, mention: SIN, health card, banking, housing, job search, language classes, or community resources.
If you don't know something specific, say so and suggest calling 211 (Canada's social services helpline).`;

/**
 * Generate a structured critical path of tasks for a newcomer profile
 */
async function generateCriticalPath(profile) {
  const url = `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const prompt = `You are an expert on Canadian immigration and newcomer onboarding.
Given this immigrant profile, generate a sequenced critical path of tasks for their first 90 days.
Return JSON only. No markdown. No backticks. No explanation.

Profile: ${JSON.stringify(profile)}

Return exactly this structure with 5-7 tasks:
{"tasks":[{"id":"sin","title":"Apply for your SIN","description":"Your Social Insurance Number is required before you can work legally in Canada.","daysFromArrival":1,"urgency":"critical","estimatedTime":"2-3 hours"}]}`;

  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  });

  const text = response.data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

/**
 * General-purpose Gemini chat with conversation history and tool support.
 * Used as the brain for all active Twilio/WhatsApp conversations.
 * @param {string} message - The user's latest message
 * @param {Array} history - Array of { role: 'user'|'model', text: string }
 * @param {string} [systemPrompt] - Optional override system prompt
 * @param {string} [userPhoneNumber] - The user's phone number for outbound calls
 */
async function chat(message, history = [], systemPrompt = null, userPhoneNumber = null) {
  const url = `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const systemInstruction = {
    parts: [{ text: systemPrompt || ROOTS_SYSTEM_PROMPT }]
  };

  // Build conversation contents from history
  const contents = [];
  for (const turn of history) {
    contents.push({
      role: turn.role,
      parts: [{ text: turn.text }]
    });
  }

  // Add the current user message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const tools = [{
    functionDeclarations: [{
      name: "makeOutboundCall",
      description: "Triggers an AI phone assistant to call the user immediately. Use this ONLY when the user explicitly asks to be called, speak on the phone, or have a phone conversation.",
      parameters: {
        type: "OBJECT",
        properties: {
          reason: {
            type: "STRING",
            description: "A short reason for the call"
          }
        },
        required: ["reason"]
      }
    }]
  }];

  const payload = {
    systemInstruction,
    contents,
    tools
  };

  const response = await axios.post(url, payload);
  const part = response.data.candidates[0].content.parts[0];

  // Handle function call (user requested a phone call)
  if (part.functionCall && part.functionCall.name === 'makeOutboundCall') {
    // Instead of initiating an outbound call, instruct the user to call inbound
    const formattedNumber = process.env.VAPI_PHONE_NUMBER_ID || process.env.TWILIO_WHATSAPP_FROM.replace('whatsapp:', '');
    return `I can't make outbound calls right now, but you can call me directly at ${formattedNumber}! Just use your phone to call me and we can talk 📞`;
  }

  // Standard text response
  return part.text ? part.text.trim() : "I'm here to help!";
}

/**
 * Transcribe audio using Gemini's multimodal capabilities
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const url = `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const base64Audio = audioBuffer.toString('base64');

  const response = await axios.post(url, {
    contents: [{
      parts: [
        { text: 'Transcribe this audio accurately. Return only the transcription text, nothing else.' },
        { inlineData: { mimeType, data: base64Audio } }
      ]
    }]
  });

  return response.data.candidates[0].content.parts[0].text.trim();
}

/**
 * Generates a dynamically phrased onboarding question based on previous context.
 * @param {Array} previousAnswers - Array of previous questions and answers
 * @param {string} targetTopic - The core question to ask next
 */
async function generateNextQuestion(previousAnswers, targetTopic) {
  const url = `${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  let context = "";
  if (previousAnswers && previousAnswers.length > 0) {
    context = `Here is what we know about the user so far:\n${previousAnswers.join('\n')}\n\n`;
  }

  const prompt = `You are Roots 🌱, a warm AI companion for newcomers to Canada.
You are currently onboarding a new user.
${context}
It is your turn to ask the user a question. The core information you need to gather is:
"${targetTopic}"

Rephrase this core question into a single, naturally conversational and friendly message.
You can briefly acknowledge their previous answer if it makes sense, but keep it short.
DO NOT provide any advice yet, just ask the question.
Your entire response must be ONLY the question (1-2 sentences max).`;

  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.data.candidates[0].content.parts[0].text.trim();
}

module.exports = { generateCriticalPath, chat, transcribeAudio, generateNextQuestion };