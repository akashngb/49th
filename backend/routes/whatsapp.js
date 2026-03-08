const express = require('express');
const router = express.Router();
const { textToSpeechUrl } = require('../services/elevenlabs');
const { uploadBuffer } = require('../services/cloudinary');
const { sendWhatsAppMessage } = require('../services/twilio');
const coordinator = require('../agents/coordinator');
const fs = require('fs');
const path = require('path');
const LOG_FILE = 'whatsapp_activity.log';

function logActivity(msg) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

router.post('/', async (req, res) => {
  const from = req.body.From;
  const message = req.body.Body;
  console.log(`📩 WhatsApp Webhook Received from ${from}: "${message}"`);
  const numMedia = parseInt(req.body.NumMedia || '0');
  const mediaType = req.body.MediaContentType0 || '';
  const isAudioInput = numMedia > 0 && mediaType.startsWith('audio/');

  // Ack Twilio immediately
  res.status(200).send('OK');

  try {
    logActivity(`Incoming from ${from}: ${message}`);
    const result = await coordinator.handle(from, message);
    logActivity(`Coordinator result: ${JSON.stringify(result).slice(0, 100)}...`);

    // Coordinator can return a string OR { text, mediaUrl }
    const replyText = typeof result === 'object' ? result.text : result;
    const imageMediaUrl = typeof result === 'object' ? result.mediaUrl : null;

    console.log('--- RESPONSE TO', from, '---');
    console.log('Text:', replyText);
    if (imageMediaUrl) console.log('🖼️ Attached Image:', imageMediaUrl);
    console.log('------------------------');

    let finalMediaUrl = imageMediaUrl;

    // If they sent audio, reply with TTS audio instead of an image
    if (isAudioInput && replyText) {
      try {
        console.log('🗣️ Generating TTS response via ElevenLabs...');
        const ttsBuffer = await textToSpeechUrl(replyText);
        console.log('☁️ Uploading TTS to Cloudinary...');
        finalMediaUrl = await uploadBuffer(ttsBuffer, `roots_tts_${Date.now()}`, 'video');
        console.log('🎵 TTS available at:', finalMediaUrl);
      } catch (ttsErr) {
        console.error('TTS Generation failed, falling back to text/image:', ttsErr.message);
      }
    }

    // Send the message via Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      logActivity(`Sending to Twilio... (Body length: ${replyText?.length})`);
      const twilioRes = await sendWhatsAppMessage(from, replyText, finalMediaUrl);
      logActivity(`Twilio Success: ${twilioRes.sid}`);
    } else {
      logActivity(`⚠️ Twilio credentials missing`);
      console.warn('⚠️ Twilio credentials missing, cannot send WhatsApp response');
    }
  } catch (err) {
    logActivity(`❌ Handler Error: ${err.message}`);
    console.error('Handler error:', err.message);
  }
});

module.exports = router;