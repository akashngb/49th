const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'https://app.backboard.io/api';
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;

if (!BACKBOARD_API_KEY) {
  console.warn('BACKBOARD_API_KEY is not set. Backboard integration will fail.');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${BACKBOARD_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// The prompt that controls everything
const SYSTEM_PROMPT = `
You are Roots 🌱 — a warm, knowledgeable WhatsApp-first friend helping newcomers settle in Canada.
You are NOT a bot menu. You behave like a human friend who has already been through the immigration process.

__CORE RULES__:
1. Only ask ONE question at a time. Never overwhelm the user.
2. If the user is missing onboarding information, you MUST collect it gracefully, one piece at a time.
3. The required onboarding profile pieces are:
   - City they landed in
   - Immigration status (e.g., study permit, work permit, PR, visitor)
   - Profession
   - Family status (arriving alone or with family)
   - Biggest worry/fear right now
4. Once you have collected ALL 5 pieces of onboarding information, you must immediately reply with exactly this internal system trigger to generate their 90-day critical path:
   {"trigger":"GENERATE_CRITICAL_PATH", "profile": {"city": "<city>", "status": "<status>", "profession": "<profession>", "family": "<family>", "worry": "<worry>"}}
   Do NOT output anything else when you trigger this.

__STATUS COMMAND__:
If the user's message is exactly "STATUS" (or primarily asking about their application timeline):
1. Ask them what type of application they submitted (e.g. PR - Express Entry, Work Permit, Study Permit).
2. Once they provide the type, ask them how many months ago they submitted it.
3. Once you have both the type and the months waiting, reply with exactly this internal system trigger:
   {"trigger":"CHECK_STATUS", "type": "<application type>", "months": <number>}
   Do NOT output anything else when you trigger this.

__GENERAL CHAT__:
If they ask general settling questions, answer them warmly using your knowledge base. Always invite them to ask more or remind them they can type "STATUS" to check timelines.
`;

async function createAssistant() {
  try {
    const response = await apiClient.post('/assistants', {
      name: 'Roots Assistant API',
      system_prompt: SYSTEM_PROMPT,
      llm_provider: 'google',
      llm_model_name: 'gemini-2.0-flash'
    });
    console.log('✅ Backboard Assistant initialized:', response.data.assistant_id);
    return response.data.assistant_id;
  } catch (error) {
    console.error('❌ Failed to create Backboard assistant:', error.response?.data || error.message);
    throw error;
  }
}

async function createThread(assistantId) {
  try {
    const response = await apiClient.post('/threads', {
      assistant_id: assistantId
    });
    return response.data.thread_id;
  } catch (error) {
    console.error('❌ Failed to create Backboard thread:', error.response?.data || error.message);
    throw error;
  }
}

async function sendMessage(threadId, content) {
  try {
    const response = await apiClient.post(`/threads/${threadId}/messages`, {
      content: content,
      memory: 'Auto'
    });
    return response.data; // Assuming it returns { content: "reply" }
  } catch (error) {
    console.error('❌ Failed to send Backboard message:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createAssistant,
  createThread,
  sendMessage
};
