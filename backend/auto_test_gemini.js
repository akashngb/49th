require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');
const key = process.env.GEMINI_API_KEY;

async function run() {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const listRes = await axios.get(listUrl);
        const models = listRes.data.models;
        console.log('✅ Found Models:', models.map(m => m.name).join(', '));

        // Try gemini-1.5-flash specifically if found, otherwise try 2.0
        const targetModel = models.find(m => m.name.includes('gemini-1.5-flash'))?.name ||
            models.find(m => m.name.includes('gemini-2.0-flash'))?.name;

        if (!targetModel) {
            console.error('❌ Could not find a suitable flash model.');
            return;
        }

        console.log(`🚀 Testing with model: ${targetModel}`);
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${key}`;
        const testRes = await axios.post(testUrl, {
            contents: [{ parts: [{ text: "Hello, confirm you are working." }] }]
        });
        console.log('✅ Gemini Response:', testRes.data.candidates[0].content.parts[0].text.trim());
    } catch (err) {
        console.error('❌ Error:', err.response?.data?.error?.message || err.message);
    }
}

run();
