const express = require('express');
const router = express.Router();
const coordinator = require('../agents/coordinator');
const cloudinary = require('cloudinary').v2;
const { extractDocumentData } = require('../services/gemini');

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbgqfpoyp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post('/', async (req, res) => {
  const message = req.body.Body || '';
  const from = req.body.From;
  const mediaUrl = req.body.MediaUrl0;

  res.status(200).send('OK');

  try {
    let responseText = '';
    let enhancedMediaUrl = null;

    if (mediaUrl) {
      console.log('--- RECEIVED MEDIA FROM', from, '---');
      console.log('Media URL:', mediaUrl);
      
      // Upload to Cloudinary and Apply AI Enhancements (cleanup, sharpening, auto-contrast)
      // to ensure Gemini can read the document perfectly even if the WhatsApp photo is blurry/dark
      const uploadResult = await cloudinary.uploader.upload(mediaUrl, { 
        folder: 'roots_intake',
        transformation: [
          { effect: "enhance" },
          { effect: "sharpen:100" },
          { effect: "auto_contrast" }
        ]
      });
      console.log('Uploaded and Enhanced via Cloudinary:', uploadResult.secure_url);
      enhancedMediaUrl = uploadResult.secure_url;

      // Pass Cloudinary URL to Gemini for strict extraction
      const extractedData = await extractDocumentData(uploadResult.secure_url);
      console.log('Extracted Data:', extractedData);

      // Structure response as strict JSON card
      responseText = JSON.stringify({
        message: `✨ Here is your enhanced document!\n\nI've successfully processed your ${extractedData.docType}.\n\nNext step: ${extractedData.nextStep}.`,
        card: {
          type: "applicationBreakdown",
          options: {
            extractedInfo: extractedData
          }
        }
      });
    } else {
      responseText = await coordinator.handle(from, message);
    }

    console.log('--- RAW RESPONSE TO', from, '---');
    console.log(responseText);
    console.log('------------------------');

    // Parse Response (we expect strict JSON string from coordinator/media branch)
    let parsedResponse;
    let textToSend = responseText;
    
    try {
      parsedResponse = JSON.parse(responseText);
      textToSend = parsedResponse.message || responseText;
    } catch (e) {
      // Fallback if not valid JSON
      parsedResponse = null;
    }

    // Only send via Twilio if credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const { sendWhatsAppMessage } = require('../services/twilio');
      await sendWhatsAppMessage(from, textToSend, enhancedMediaUrl);
    }
  } catch (err) {
    console.error('Handler error:', err);
  }
});

module.exports = router;