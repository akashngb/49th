require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');
const key = process.env.GEMINI_API_KEY;

if (!key) {
    console.error('❌ GEMINI_API_KEY is not set in environment!');
    process.exit(1);
}

console.log(`Key: [${key}]`);
console.log(`Length: ${key.length}`);
console.log(`Hex: ${Buffer.from(key).toString('hex')}`);

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key.trim()}`;
const data = {
    contents: [{
        parts: [{ text: "Hello" }]
    }]
};

axios.post(url, data)
    .then(res => {
        console.log('✅ Success!');
        console.log(res.data);
    })
    .catch(err => {
        console.log('❌ Error:');
        if (err.response) {
            console.log(JSON.stringify(err.response.data, null, 2));
        } else {
            console.log(err.message);
        }
    });
