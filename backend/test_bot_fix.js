const axios = require('axios');

async function testBot() {
    console.log('🚀 Starting WhatsApp Bot Test...');

    const payload = {
        From: '+1234567890',
        Body: 'How do I get a SIN?',
        NumMedia: '0'
    };

    console.log('\n--- Test 1: Onboarding Interruption (Question) ---');
    try {
        const res = await axios.post('http://localhost:3001/webhook', payload);
        console.log('Response Status:', res.status);
    } catch (err) {
        console.error('Test 1 failed:', err.message);
    }

    console.log('\n--- Test 2: Image Media Handling (Simulated) ---');
    const imagePayload = {
        From: '+1234567890',
        Body: '',
        NumMedia: '1',
        MediaUrl0: 'https://images2.imgbox.com/6c/d2/VvG7Y8G2_o.jpg', // Placeholder image
        MediaContentType0: 'image/jpeg'
    };
    try {
        const res = await axios.post('http://localhost:3001/webhook', imagePayload);
        console.log('Response Status:', res.status);
    } catch (err) {
        console.error('Test 2 failed:', err.message);
    }
}

testBot();
