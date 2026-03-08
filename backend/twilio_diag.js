require('dotenv').config();
const { sendWhatsAppMessage } = require('./services/twilio');

async function test() {
    console.log('Testing Twilio WhatsApp Send...');
    try {
        // Replace with the user's actual phone number. Need to get it from the logs or hardcode a safe string.
        // Wait, I can't guess their phone number. I'll just send a text to a dummy number to see if it even authenticates.
        // Actually, I'll read the last known FROM number from the index.js process if possible, but I can't.
        // I am just going to check the Account limits by retrieving the account info!
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const account = await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log('Account Status:', account.status);
        console.log('Account Type:', account.type);

        // Let's also check the most recent message errors in the Twilio account
        const messages = await client.messages.list({ limit: 5 });
        for (const msg of messages) {
            console.log(`Msg to ${msg.to}: Status ${msg.status}, ErrorCode ${msg.errorCode}, ErrorMsg ${msg.errorMessage}`);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
