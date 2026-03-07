const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize clients
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function uploadToStorage(audioStream) {
    const fileName = `voice_${Date.now()}_${Math.floor(Math.random() * 1000)}.ogg`;
    const publicDir = path.join(__dirname, '..', 'public', 'voice_notes');

    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, fileName);

    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        audioStream.pipe(fileStream);
        fileStream.on('finish', () => {
            const publicUrl = `${process.env.PUBLIC_URL}/public/voice_notes/${fileName}`;
            resolve(publicUrl);
        });
        fileStream.on('error', reject);
    });
}

// Download a Twilio media URL (requires Basic Auth) and transcribe via ElevenLabs STT
async function transcribeVoiceNote(mediaUrl) {
    // 1. Download the audio from Twilio (requires auth because media is private)
    const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
        }
    });

    // 2. Save temp file
    const tmpDir = path.join(__dirname, '..', 'public', 'voice_notes');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `incoming_${Date.now()}.ogg`);
    fs.writeFileSync(tmpFile, response.data);

    // 3. Transcribe via ElevenLabs STT
    try {
        const transcript = await elevenlabs.speechToText.convert({
            file: fs.createReadStream(tmpFile),
            model_id: 'scribe_v1'
        });
        // Return both the text and the detected language code (e.g. "ar", "ur", "fr")
        return { text: transcript.text, language: transcript.language_code || 'en' };
    } finally {
        // Cleanup temp file
        fs.unlink(tmpFile, () => { });
    }
}

async function sendRootsVoiceNote(userPhoneNumber, geminiResponseText) {
    if (!process.env.ELEVENLABS_API_KEY) {
        console.warn('Skipping ElevenLabs voice note: no API key.');
        return;
    }

    // 1. Convert text to OGG/Opus
    const audioStream = await elevenlabs.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb",
        {
            text: geminiResponseText,
            model_id: "eleven_multilingual_v2",
            output_format: "ogg_44100_128",
            voice_settings: { stability: 0.4, similarity_boost: 0.8 }
        }
    );

    // 2. Save locally and get public URL
    const publicAudioUrl = await uploadToStorage(audioStream);

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_FROM
        : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    const toNumber = userPhoneNumber.startsWith('whatsapp:')
        ? userPhoneNumber
        : `whatsapp:${userPhoneNumber}`;

    // 3. Send as voice note via Twilio
    await client.messages.create({
        from: fromNumber,
        to: toNumber,
        mediaUrl: [publicAudioUrl]
    });
}

module.exports = { sendRootsVoiceNote, transcribeVoiceNote };

