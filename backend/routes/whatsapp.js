const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');

router.post('/', async (req, res) => {
  const message = req.body.Body;
  const from = req.body.From;
  const numMedia = parseInt(req.body.NumMedia || '0');

  res.status(200).send('OK');

  try {
    const response = await coordinator.handle(from, message);
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
    // if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    //   const { sendWhatsAppMessage } = require('../services/twilio');
    //   await sendWhatsAppMessage(from, response);
    // }
  } catch (err) {
    console.error('Handler error:', err);
  }
});

module.exports = router;