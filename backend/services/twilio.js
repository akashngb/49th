const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsAppMessage(to, body, mediaUrl = null) {
  const messageData = {
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body
  };
  
  if (mediaUrl) {
    messageData.mediaUrl = [mediaUrl];
  }

  const result = await client.messages.create(messageData);
  console.log('Twilio send result:', result.sid, result.status);
  return result;
}

module.exports = { sendWhatsAppMessage };
