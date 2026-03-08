const axios = require('axios');
const FormData = require('form-data');

/**
 * Backboard.io — AI Memory + LLM Router
 * Provides persistent memory across conversations using the Assistants/Threads architecture.
 */

const BACKBOARD_BASE = 'https://app.backboard.io/api';

let sharedAssistantId = null;
const userThreads = new Map();

async function getAssistant(apiKey, systemPrompt) {
    if (sharedAssistantId) return sharedAssistantId;

    try {
        const response = await axios.get(`${BACKBOARD_BASE}/assistants`, {
            headers: { 'X-API-Key': apiKey }
        });

        let assistant = response.data.find(a => a.name === "Roots Multilingual Assistant");

        if (!assistant) {
            const createRes = await axios.post(`${BACKBOARD_BASE}/assistants`, {
                name: "Roots Multilingual Assistant",
                system_prompt: systemPrompt || `You are Roots, a warm and knowledgeable AI companion for newcomers to Canada. You help immigrants navigate settlement, from documents and healthcare to career and community. \n\nCRITICAL: ALWAYS respond in the exact same language the user uses (French, Spanish, etc.). If they speak in French, you MUST respond in French. If they speak in Spanish, respond in Spanish. NEVER switch back to English unless the user does. Be concise, practical, and empathetic.`
            }, {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            assistant = createRes.data;
        }

        console.log('Backboard Assistant:', assistant);
        sharedAssistantId = assistant.assistant_id || assistant.id || assistant.assistantId;
        return sharedAssistantId;
    } catch (err) {
        console.error('Backboard getAssistant error:', err.response?.data || err.message);
        throw err;
    }
}

// Send a message to the Backboard AI with persistent memory context (via Threads)
async function chat(userId, message, systemPrompt) {
    const apiKey = process.env.BACKBOARD_API_KEY;
    if (!apiKey) throw new Error('BACKBOARD_API_KEY not set');

    const aid = await getAssistant(apiKey, systemPrompt);

    // Get or create a thread for this user session
    let threadId = userThreads.get(userId);
    if (!threadId) {
        try {
            const threadRes = await axios.post(`${BACKBOARD_BASE}/assistants/${aid}/threads`, {}, {
                headers: { 'X-API-Key': apiKey }
            });
            threadId = threadRes.data.thread_id || threadRes.data.id;
            userThreads.set(userId, threadId);
        } catch (err) {
            console.error('Backboard createThread error:', err.response?.data || err.message);
            throw err;
        }
    }

    try {
        const msgRes = await axios.post(`${BACKBOARD_BASE}/assistants/${aid}/threads/${threadId}/messages`, {
            content: message
        }, {
            headers: { 'X-API-Key': apiKey }
        });
        return msgRes.data.response;
    } catch (err) {
        console.error('Backboard chat error:', err.response?.data || err.message);
        throw err;
    }
}

// Store memory for a user/thread
function storeMemory(userId, memory) {
    // This is a placeholder for persistent memory storage if needed
    // In production, you might store this in a database or Backboard's memory API
    // For now, this is a no-op
}

module.exports = { chat, storeMemory };
