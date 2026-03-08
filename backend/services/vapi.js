const axios = require('axios');

const VAPI_BASE = 'https://api.vapi.ai';

const INTERVIEW_SYSTEM_PROMPT = `You are a professional AI phone assistant conducting a conversational interview. Your role is to ask questions naturally and gather information from the caller.

WORKFLOW:
1. Greet the caller warmly when the call connects
2. Ask each question one at a time
3. Wait for the user's complete answer before moving to the next question
4. Acknowledge their responses briefly before continuing
5. Keep the conversation flowing naturally

QUESTIONS TO ASK (in order):
1. What is your name?
2. What service are you interested in?
3. When would you like to schedule an appointment?
4. Do you have any specific requirements or questions?

CONVERSATION GUIDELINES:
- Keep your responses brief and conversational (1-2 sentences max)
- Be warm, friendly, and professional
- If the user doesn't understand a question, rephrase it simply
- If they go off-topic, gently guide them back to the current question
- Don't rush - let them speak fully
- Confirm important details (like dates/times) by repeating them back
- At the end, thank them and let them know someone will follow up

TONE:
- Friendly and approachable
- Professional but not robotic
- Patient and understanding
- Clear and concise

EXAMPLE CONVERSATION FLOW:
Assistant: "Hi! Thanks for requesting a call. I'm your AI assistant and I have a few quick questions for you. First, may I have your name?"
User: "It's John Smith"
Assistant: "Great to meet you, John! Now, what service are you interested in today?"
User: "I need a consultation"
Assistant: "Perfect! When would be a good time to schedule that consultation?"
[Continue through remaining questions...]
Assistant: "Thank you so much, John. I've got all the information I need. Someone from our team will reach out to you shortly to confirm your consultation. Have a great day!"

Remember: Quality conversation over speed. Make the caller feel heard and valued.`;

/**
 * Get the Vapi API key from environment
 */
function getApiKey() {
    const key = process.env.VAPI_PRIVATE_API_KEY;
    if (!key) throw new Error('VAPI_PRIVATE_API_KEY is not set in .env');
    return key;
}

/**
 * Create or update the interview assistant on Vapi.
 * Returns the assistant object (with .id).
 */
async function createOrUpdateAssistant() {
    const apiKey = getApiKey();

    const assistantConfig = {
        name: '49th Immigration Companion — Interview',
        firstMessage: "Hi! Thanks for requesting a call. I'm your AI assistant and I have a few quick questions for you. First, may I have your name?",
        model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: INTERVIEW_SYSTEM_PROMPT
                }
            ]
        },
        voice: {
            provider: '11labs',
            voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah — warm, professional ElevenLabs voice
            stability: 0.5,
            similarityBoost: 0.75
        },
        transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'en-US'
        },
        endCallPhrases: ['goodbye', 'bye', 'thank you, goodbye', 'have a great day'],
        endCallMessage: 'Thank you for your time! Someone from our team will reach out to you shortly. Have a great day!',
        maxDurationSeconds: 600
    };

    // Check if we already have an assistant ID saved in env
    const existingId = process.env.VAPI_ASSISTANT_ID;
    if (existingId && existingId.startsWith('asst_') === false) {
        // Try to update existing Vapi assistant
        try {
            const res = await axios.patch(
                `${VAPI_BASE}/assistant/${existingId}`,
                assistantConfig,
                { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            console.log('✅ Vapi assistant updated:', res.data.id);
            return res.data;
        } catch (err) {
            console.warn('⚠️ Could not update existing Vapi assistant, creating new one:', err.response?.data || err.message);
        }
    }

    // Create a new assistant
    const res = await axios.post(
        `${VAPI_BASE}/assistant`,
        assistantConfig,
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    console.log('✅ Vapi assistant created:', res.data.id);
    return res.data;
}

/**
 * Make an outbound call using Vapi.
 * @param {string} phoneNumber - E.164 format, e.g. "+14155551234"
 * @param {string} assistantId - Vapi assistant ID
 * @param {string} phoneNumberId - Vapi phone number ID (from your Vapi dashboard)
 */
async function makeCall(phoneNumber, assistantId, phoneNumberId) {
    const apiKey = getApiKey();

    const payload = {
        assistant: { assistantId },
        customer: { number: phoneNumber },
        phoneNumberId
    };

    const res = await axios.post(
        `${VAPI_BASE}/call/phone`,
        payload,
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    console.log('📞 Vapi call initiated:', res.data.id, '→', phoneNumber);
    return res.data;
}

/**
 * Get the status of a Vapi call (including transcript once ended).
 * @param {string} callId
 */
async function getCallStatus(callId) {
    const apiKey = getApiKey();

    const res = await axios.get(
        `${VAPI_BASE}/call/${callId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    return res.data;
}

/**
 * List recent calls
 */
async function listCalls(limit = 10) {
    const apiKey = getApiKey();

    const res = await axios.get(
        `${VAPI_BASE}/call?limit=${limit}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    return res.data;
}

module.exports = { createOrUpdateAssistant, makeCall, getCallStatus, listCalls, INTERVIEW_SYSTEM_PROMPT };
