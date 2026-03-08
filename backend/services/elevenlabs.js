const axios = require('axios');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

/**
 * ElevenLabs — Voice Synthesis
 * Converts text responses to natural-sounding speech audio.
 */

let sdkClient = null;

function getSdkClient() {
    if (!sdkClient) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');
        sdkClient = new ElevenLabsClient({ apiKey });
    }
    return sdkClient;
}

/**
 * Convert text to speech and return an audio Buffer via the ElevenLabs REST API.
 * Used by whatsapp.js to get a buffer suitable for Cloudinary upload.
 * @param {string} text
 * @returns {Buffer}
 */
async function textToSpeechUrl(text) {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Rachel — default robust English voice

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    try {
        const response = await axios.post(
            url,
            {
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            },
            {
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer',
            }
        );
        return Buffer.from(response.data);
    } catch (error) {
        console.error('ElevenLabs textToSpeechUrl error:', error?.response?.data || error.message);
        throw error;
    }
}

/**
 * Convert text to speech using the ElevenLabs SDK.
 * Returns a Buffer — used by /api/tts and the voices endpoint.
 * @param {string} text
 * @param {string} voiceId
 * @returns {Buffer}
 */
async function textToSpeech(text, voiceId = 'JBFqnCBsd6RMkjVDRZzb') {
    // Default voice: "George" — warm, professional male voice
    const elevenLabs = getSdkClient();

    const audioStream = await elevenLabs.textToSpeech.convert(voiceId, {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
    });

    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

/**
 * List available voices from ElevenLabs.
 */
async function listVoices() {
    const elevenLabs = getSdkClient();
    const voices = await elevenLabs.voices.getAll();
    return voices.voices?.map(v => ({
        id: v.voiceId,
        name: v.name,
        category: v.category,
    })) || [];
}
module.exports = { textToSpeechUrl, textToSpeech, listVoices };
