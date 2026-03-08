require('dotenv').config();
const fs = require('fs');
const twilio = require('twilio');

async function checkLogs() {
    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const messages = await client.messages.list({ limit: 10 });
        const logData = messages.map(msg => ({
            to: msg.to,
            status: msg.status,
            errorCode: msg.errorCode,
            errorMsg: msg.errorMessage,
            dateSent: msg.dateSent,
            body: msg.body
        }));
        fs.writeFileSync('twilio_logs.json', JSON.stringify(logData, null, 2));
        console.log('Saved to twilio_logs.json');
    } catch (err) {
        console.error('Error:', err);
    }
}

checkLogs();
