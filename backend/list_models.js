require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');
const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

axios.get(url)
    .then(res => {
        console.log(JSON.stringify(res.data, null, 2));
    })
    .catch(err => {
        console.error('❌ Error:', err.response?.data?.error?.message || err.message);
    });
