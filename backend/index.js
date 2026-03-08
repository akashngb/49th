require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/webhook', require('./routes/whatsapp'));
app.use('/api', require('./routes/api'));

// Handle misconfigured Vapi dashboard URLs — forward to the correct handler
app.post('/vapi/webhook', (req, res, next) => {
    // Forward the request to the correct /api/vapi/webhook handler
    req.url = '/vapi/webhook';
    require('./routes/api')(req, res, next);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

app.listen(3001, () => console.log('Roots backend running on 3001'));