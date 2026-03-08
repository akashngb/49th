require('dotenv').config();
const axios = require('axios');

async function fixPhoneNumber() {
    const apiKey = process.env.VAPI_PRIVATE_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;

    try {
        console.log('Fetching phone numbers from Vapi...');
        const res = await axios.get('https://api.vapi.ai/phone-number', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        const numbers = res.data;
        if (!numbers || numbers.length === 0) {
            console.log('No phone numbers found in this Vapi account!');
            return;
        }

        const myNumber = numbers.find(n => n.number === process.env.VAPI_PHONE_NUMBER_ID);
        if (!myNumber) {
            console.log(`Could not find ${process.env.VAPI_PHONE_NUMBER_ID} in the Vapi account. Found:`, numbers.map(n => n.number));
            return;
        }

        console.log(`Found phone number! ID is ${myNumber.id}. Currently attached to assistant: ${myNumber.assistantId}`);

        console.log(`Patching phone number to use Assistant ID: ${assistantId}...`);
        const patchRes = await axios.patch(`https://api.vapi.ai/phone-number/${myNumber.id}`, {
            assistantId: assistantId
        }, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        console.log('✅ Phone number successfully patched! It should now answer using the Roots Immigration Assistant.');
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

fixPhoneNumber();
