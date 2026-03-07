const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');

router.post('/', async (req, res) => {
  res.status(200).send('OK');

  const from = req.body.From;
  const numMedia = parseInt(req.body.NumMedia || '0');
  const mediaContentType = req.body.MediaContentType0 || '';
  const isVoiceNote = numMedia > 0 && mediaContentType.startsWith('audio/');

  try {
    let messageText;
    let detectedLanguage = null;

    if (isVoiceNote) {
      // User sent a voice note — transcribe it first
      const mediaUrl = req.body.MediaUrl0;
      console.log(`🎙️ Voice note from ${from}, transcribing...`);

      const { transcribeVoiceNote } = require('../services/elevenlabs');
      const result = await transcribeVoiceNote(mediaUrl);
      detectedLanguage = result.language;
      messageText = result.text;
      console.log(`📝 Transcribed (${detectedLanguage}): "${messageText}"`);
    } else {
      // Plain text message
      messageText = req.body.Body;
    }

    // If a language was detected from a voice note, prefix it so the LLM
    // knows explicitly which language to reply in
    const coordinatorInput = detectedLanguage && detectedLanguage !== 'en'
      ? `[User language: ${detectedLanguage}] ${messageText}`
      : messageText;

    const response = await coordinator.handle(from, coordinatorInput);
    console.log('--- RESPONSE TO', from, '---');
    console.log(response);
    console.log('------------------------');

    // Only send via Twilio if credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      if (isVoiceNote && process.env.ELEVENLABS_API_KEY) {
        // User sent voice → reply with voice note only
        console.log('🔊 Replying with voice note...');
        const { sendRootsVoiceNote } = require('../services/elevenlabs');
        await sendRootsVoiceNote(from, response);
      } else {
        // User sent text → reply with text only
        const { sendWhatsAppMessage } = require('../services/twilio');
        await sendWhatsAppMessage(from, response);
      }
    }
  } catch (err) {
    console.error('Handler error:', err);
  }
});

module.exports = router;
