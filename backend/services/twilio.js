const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsAppMessage(to, body, mediaUrl = null) {
  const payload = {
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body
  };

  if (mediaUrl) {
    payload.mediaUrl = [mediaUrl];
  }

  try {
    const result = await client.messages.create(payload);
    console.log('✅ Twilio send success:', result.sid, result.status);
    return result;
  } catch (err) {
    console.error('❌ Twilio send error:', err.code, err.message, err.moreInfo);
    throw err;
  }
}

module.exports = { sendWhatsAppMessage };
