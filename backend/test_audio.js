require('dotenv').config();
const { textToSpeechUrl } = require('./services/elevenlabs');
const { uploadBuffer } = require('./services/cloudinary');

async function runTests() {
    console.log("🧪 Starting Audio Setup Tests...\n");

    try {
        // TEST 1: ElevenLabs TTS
        console.log("Test 1: Generating Text-to-Speech via ElevenLabs...");
        console.log("Using API Key:", process.env.ELEVENLABS_API_KEY ? "✅ Configured" : "❌ Missing");

        const testText = "Hello! This is a test of the ElevenLabs audio system.";
        const audioBuffer = await textToSpeechUrl(testText);

        if (audioBuffer && audioBuffer.length > 0) {
            console.log(`✅ Success! Generated audio buffer of size: ${audioBuffer.length} bytes\n`);
        } else {
            throw new Error("Returned buffer was empty");
        }

        // TEST 2: Cloudinary Upload
        console.log("Test 2: Uploading generated audio buffer to Cloudinary...");
        console.log("Using Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Configured" : "❌ Missing");

        const publicId = `test_audio_${Date.now()}`;
        const mediaUrl = await uploadBuffer(audioBuffer, publicId, 'video');

        if (mediaUrl && mediaUrl.startsWith('http')) {
            console.log(`✅ Success! Audio file hosted at: \n${mediaUrl}\n`);
        } else {
            throw new Error(`Upload failed or returned invalid URL: ${mediaUrl}`);
        }

        console.log("🎉 All internal audio systems are working perfectly!");
        console.log("Next Step: Send a voice note to your Twilio WhatsApp number to test the final end-to-end connection.");

    } catch (err) {
        console.error("\n❌ TEST FAILED");
        console.error(err.message);
        if (err.response) {
            console.error("API Response Details:", err.response.data);
        }
    }
}

runTests();
