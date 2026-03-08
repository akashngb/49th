const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');
const axios = require('axios');
const { transcribeAudio } = require('../services/gemini');
const { textToSpeechUrl } = require('../services/elevenlabs');
const { uploadBuffer } = require('../services/cloudinary');

router.post('/', async (req, res) => {
  let message = req.body.Body;
  const from = req.body.From;
  const numMedia = parseInt(req.body.NumMedia || '0');

  res.status(200).send('OK');

  try {
    let isAudio = false;

    // Check if the user sent a Twilio voice note
    if (numMedia > 0 && req.body.MediaContentType0 && req.body.MediaContentType0.startsWith('audio/')) {
      isAudio = true;
      console.log('🎙️ Received audio message from', from);

      const audioUrl = req.body.MediaUrl0;

      // Fetch the audio buffer from Twilio securely
      const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const mediaRes = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        headers: { Authorization: authHeader }
      });

      const audioBuffer = Buffer.from(mediaRes.data);

      // Transcribe using Gemini 2.5 Flash
      message = await transcribeAudio(audioBuffer, req.body.MediaContentType0);
      console.log(`📝 Transcribed user audio: "${message}"`);
    }

    let rawResponse = await coordinator.handle(from, message);

    let replyText = typeof rawResponse === 'string' ? rawResponse : rawResponse.text;
    let imageMediaUrl = typeof rawResponse === 'object' ? rawResponse.mediaUrl : null;

    console.log('--- RESPONSE TO', from, '---');
    console.log(replyText);
    if (imageMediaUrl) console.log('🖼️ Attached Image:', imageMediaUrl);
    console.log('------------------------');

    let audioMediaUrl = null;

    // If they sent audio, reply with TTS audio instead of an image (Twilio can send audio + text)
    if (isAudio) {
      console.log('🗣️ Generating TTS response via ElevenLabs...');
      const ttsBuffer = await textToSpeechUrl(replyText);
      console.log('☁️ Uploading TTS to Cloudinary...');
      audioMediaUrl = await uploadBuffer(ttsBuffer, `roots_tts_${Date.now()}`, 'video');
      console.log('🎵 TTS available at:', audioMediaUrl);
    }

    // Only send via Twilio if credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const { sendWhatsAppMessage } = require('../services/twilio');
      // If there's audio, send the audio. Otherwise, send the image if one was generated.
      const finalMediaUrl = audioMediaUrl || imageMediaUrl;
      await sendWhatsAppMessage(from, replyText, finalMediaUrl);
    }
  } catch (err) {
    console.error('Handler error:', err);
  }
});

module.exports = router;