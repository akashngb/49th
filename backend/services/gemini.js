const axios = require('axios');

async function generateCriticalPath(profile) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `You are an expert on Canadian immigration and newcomer onboarding.
Given this immigrant profile, generate a sequenced critical path of tasks for their first 90 days.
Return JSON only. No markdown. No backticks. No explanation.

Profile: ${JSON.stringify(profile)}

Return exactly this structure with 5-7 tasks:
{"tasks":[{"id":"sin","title":"Apply for your SIN","description":"Your Social Insurance Number is required before you can work legally in Canada.","daysFromArrival":1,"urgency":"critical","estimatedTime":"2-3 hours"}]}`;

  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  });

  const text = response.data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [
        { text: "Accurately transcribe this audio. Return ONLY the transcription text. No explanation." },
        {
          inline_data: {
            mime_type: mimeType,
            data: audioBuffer.toString('base64')
          }
        }
      ]
    }]
  };

  const response = await axios.post(url, payload);
  return response.data.candidates[0].content.parts[0].text.trim();
}

module.exports = { generateCriticalPath, transcribeAudio };

// At the bottom of gemini.js, temporarily:
if (require.main === module) {
  generateCriticalPath({ answers: ["Toronto", "PR", "Engineer", "alone", "banking"] })
    .then(console.log)
    .catch(e => console.error(e.response?.data || e.message));
}