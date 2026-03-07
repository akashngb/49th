const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendWhatsAppMessage(to, body) {
  const result = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body
  });
  console.log('Twilio send result:', result.sid, result.status);
  return result;
}

module.exports = { sendWhatsAppMessage };
