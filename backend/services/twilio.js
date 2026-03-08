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

  const result = await client.messages.create(payload);
  console.log('Twilio send result:', result.sid, result.status);
  return result;
}

module.exports = { sendWhatsAppMessage };
