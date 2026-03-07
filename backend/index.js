require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { createAssistant } = require('./services/backboard');
const { setAssistantId } = require('./agents/coordinator');

app.use('/webhook', require('./routes/whatsapp'));

// Initialize Backboard Assistant before accepting requests
createAssistant()
    .then((id) => {
        setAssistantId(id);
        app.listen(3000, () => console.log('Roots backend running on 3000 with Backboard.io!'));
    })
    .catch((err) => {
        console.error('Failed to initialize Backboard Assistant. Exiting...');
        process.exit(1);
    });