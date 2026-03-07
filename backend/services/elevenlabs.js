const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const fs = require('fs');
const path = require('path');

/**
 * ElevenLabs — Voice Synthesis
 * Converts text responses to natural-sounding speech audio.
 * Used for the voice companion feature in the 49th platform.
 */

let client = null;

function getClient() {
    if (!client) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');
        client = new ElevenLabsClient({ apiKey });
    }
    return client;
}

// Convert text to speech and return audio buffer
async function textToSpeech(text, voiceId = 'JBFqnCBsd6RMkjVDRZzb') {
    // Default voice: "George" — warm, professional male voice
    // Other good options: 
    //   '21m00Tcm4TlvDq8ikWAM' = Rachel (female)
    //   'EXAVITQu4vr4xnSDxMaL' = Bella (female)
    const elevenLabs = getClient();

    const audioStream = await elevenLabs.textToSpeech.convert(voiceId, {
        text,
        modelId: 'eleven_multilingual_v2', // High-quality multilingual support
        outputFormat: 'mp3_44100_128',
    });

    // Collect stream chunks into a buffer
    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// Convert text to speech and save to file
async function textToSpeechFile(text, filename, voiceId) {
    const buffer = await textToSpeech(text, voiceId);
    const outputDir = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, buffer);
    return filepath;
}

// List available voices
async function listVoices() {
    const elevenLabs = getClient();
    const voices = await elevenLabs.voices.getAll();
    return voices.voices?.map(v => ({
        id: v.voiceId,
        name: v.name,
        category: v.category,
    })) || [];
}

module.exports = { textToSpeech, textToSpeechFile, listVoices };
