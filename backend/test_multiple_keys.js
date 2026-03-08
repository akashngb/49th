const axios = require('axios');
const keys = [
    "AIzaSyB_EZHXqL6puWjy7Vmn8MZvTBJVNyTj9F8", // Partial key from logs
    "AIzaSy89p-oIwwUUJvlI9uBY8Vay-s5LgYYlpK",
    "AIzaSyAmqc0AikyWqDYtqLO6puWjy7Vmn8M"
];

async function testKeys() {
    for (const key of keys) {
        console.log(`Testing key: ${key.substring(0, 10)}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        try {
            const res = await axios.post(url, { contents: [{ parts: [{ text: "hi" }] }] });
            console.log(`✅ SUCCESS for key: ${key.substring(0, 10)}...`);
            console.log('Response:', res.data.candidates[0].content.parts[0].text.trim());
            return;
        } catch (err) {
            console.log(`❌ FAILED for key: ${key.substring(0, 10)}... Error: ${err.response?.data?.error?.message || err.message}`);
        }
    }
}

testKeys();
