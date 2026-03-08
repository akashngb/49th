const axios = require('axios');
const key = "AIzaSyB_EZHXqc0AikyWqDYtqLO6puWjy7Vmn8M";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

axios.post(url, { contents: [{ parts: [{ text: "hi" }] }] })
    .then(res => console.log('✅ Success:', res.data.candidates[0].content.parts[0].text.trim()))
    .catch(err => console.error('❌ Error:', err.response?.data?.error?.message || err.message));
