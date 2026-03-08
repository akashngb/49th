const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCc0fvfqMvfRFJaIMPPByYSxn_MM5n37Y8";
const data = {
    contents: [{
        parts: [{ text: "Say hello" }]
    }]
};

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
})
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));