const axios = require('axios');

async function textToSpeechUrl(text) {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    // Use a friendly, conversational voice ID (e.g., Sarah or Rachel)
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Rachel (default robust English voice)

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
                    'Accept': 'audio/mpeg'
                },
                responseType: 'arraybuffer'
            }
        );

        // Now we have the audio buffer. We need a public URL for Twilio.
        // Instead of configuring Cloudinary upload here, we'll return the buffer
        // and let the route handle uploading it or proxying it.
        return Buffer.from(response.data);
    } catch (err) {
        console.error('ElevenLabs error:', err.response?.data || err.message);
        throw err;
    }
}

module.exports = { textToSpeechUrl };
