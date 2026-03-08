const axios = require('axios');
const key = "AIzaSyB_EZHXqc0AikyWqDYtqLO6puWjy7Vmn8M";
const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
];
const versions = ["v1", "v1beta"];

async function testAll() {
    for (const v of versions) {
        for (const m of models) {
            const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${key}`;
            try {
                const res = await axios.post(url, { contents: [{ parts: [{ text: "hi" }] }] });
                console.log(`✅ SUCCESS: ${v} / ${m}`);
                console.log('Response:', res.data.candidates[0].content.parts[0].text.trim());
                return;
            } catch (err) {
                console.log(`❌ FAILED: ${v} / ${m} - ${err.response?.status} ${err.response?.data?.error?.message || err.message}`);
            }
        }
    }
}

testAll();
