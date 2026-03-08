const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');
const axios = require('axios');
const { transcribeAudio, extractDocumentData } = require('../services/gemini');
const { textToSpeech } = require('../services/elevenlabs');
const { uploadBuffer } = require('../services/cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbgqfpoyp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post('/', async (req, res) => {
  let message = req.body.Body || '';
  const from = req.body.From;
  const numMedia = parseInt(req.body.NumMedia || '0');

  res.status(200).send('OK');

  try {
    let isAudio = false;
    let isImage = false;

    // Check media type
    if (numMedia > 0 && req.body.MediaContentType0) {
      const contentType = req.body.MediaContentType0;
      const mediaUrl = req.body.MediaUrl0;

      if (contentType.startsWith('audio/')) {
        // ── AUDIO: transcribe with Gemini then reply with TTS ──
        isAudio = true;
        console.log('🎙️ Received audio message from', from);

        const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const mediaRes = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          headers: { Authorization: authHeader }
        });

        const audioBuffer = Buffer.from(mediaRes.data);
        message = await transcribeAudio(audioBuffer, contentType);
        console.log(`📝 Transcribed user audio: "${message}"`);

      } else if (contentType.startsWith('image/')) {
        // ── IMAGE: upload to Cloudinary and extract document data ──
        isImage = true;
        console.log('📄 Received image/document from', from);

        const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const mediaRes = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          headers: { Authorization: authHeader }
        });

        if (!mediaRes || !mediaRes.data) {
          throw new Error('Failed to download media content');
        }

        // Use the cloudinary stream to upload the buffer, but apply enhancements
        const imageBuffer = Buffer.from(mediaRes.data);
        const cloudinaryUrl = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              public_id: `roots_doc_${Date.now()}`,
              folder: 'roots_intake',
              transformation: [
                { effect: "enhance" },
                { effect: "sharpen:100" },
                { effect: "auto_contrast" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          uploadStream.end(imageBuffer);
        });

        console.log('☁️ Uploaded to Cloudinary with enhancements:', cloudinaryUrl);

        const extractedData = await extractDocumentData(cloudinaryUrl);
        console.log('📋 Extracted Data:', extractedData);

        const docReply = JSON.stringify({
          message: `✨ Here is your enhanced document!\n\nI've successfully processed your ${extractedData.docType}.\n\nNext step: ${extractedData.nextStep}.`,
          card: {
            type: "applicationBreakdown",
            options: {
              extractedInfo: extractedData
            }
          }
        });

        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          const { sendWhatsAppMessage } = require('../services/twilio');
          await sendWhatsAppMessage(from, docReply, cloudinaryUrl);
        }
        return; // Document handled — exit early
      }
    }

    // ── Standard text or transcribed audio flow ──
    let rawResponse = await coordinator.handle(from, message);

    let replyText = typeof rawResponse === 'string' ? rawResponse : rawResponse.text;
    let imageMediaUrl = typeof rawResponse === 'object' ? rawResponse.mediaUrl : null;

    console.log('--- RESPONSE TO', from, '---');
    console.log(replyText);
    if (imageMediaUrl) console.log('🖼️ Attached Image:', imageMediaUrl);
    console.log('------------------------');

    let audioMediaUrl = null;

    // If they sent an audio voice note, reply with a TTS voice note
    if (isAudio) {
      console.log('🗣️ Generating TTS response via ElevenLabs...');
      const ttsBuffer = await textToSpeech(replyText); // eleven_multilingual_v2 — supports Turkish, French, Spanish, etc.
      console.log('☁️ Uploading TTS to Cloudinary...');
      audioMediaUrl = await uploadBuffer(ttsBuffer, `roots_tts_${Date.now()}`, 'video');
      console.log('🎵 TTS available at:', audioMediaUrl);
    }

    // Only send via Twilio if credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const { sendWhatsAppMessage } = require('../services/twilio');
      // Prefer audio reply > image graphic > plain text
      const finalMediaUrl = audioMediaUrl || imageMediaUrl;
      await sendWhatsAppMessage(from, replyText, finalMediaUrl);
    }
  } catch (err) {
    console.error('Handler error:', err);
  }
});

module.exports = router;