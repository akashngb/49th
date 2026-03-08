require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const cloudinary = require('cloudinary').v2;
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// ===================
// 1. CONFIGURATION
// ===================

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_NUMBER,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    ANTHROPIC_API_KEY
} = process.env;

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const conversationHistory = new Map(); // phoneNumber -> [{role, content}]

// ===================
// 2. HELPERS
// ===================

async function downloadImage(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            auth: {
                username: TWILIO_ACCOUNT_SID,
                password: TWILIO_AUTH_TOKEN
            }
        });
        return Buffer.from(response.data, 'binary');
    } catch (err) {
        console.error('❌ Error downloading image:', err.message);
        throw new Error('Failed to download image.');
    }
}

async function uploadToCloudinary(buffer, folder, filename) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: filename,
                quality: 'auto:best',
                effect: 'sharpen:100',
                transformation: [
                    { effect: 'contrast:20' },
                    { quality: 'auto:best' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error.message);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        uploadStream.end(buffer);
    });
}

async function analyzeImageWithClaude(base64Image, history) {
    try {
        const systemPrompt = `You are an immigration onboarding assistant. Analyze the provided document image. Identify the document type, explain its relevance to immigration onboarding, note important dates/requirements, and highlight any concerns. Be clear and culturally sensitive.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            {
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            }
        ];
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages
            },
            {
                headers: {
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );
        return response.data.content[0].text;
    } catch (err) {
        console.error('❌ Claude image analysis error:', err.message);
        throw new Error('Failed to analyze image.');
    }
}

async function analyzeTextWithClaude(text, history) {
    try {
        const systemPrompt = `You are an immigration onboarding assistant. Answer questions with clear, helpful, and culturally sensitive information about immigration processes.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: text }
        ];
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages
            },
            {
                headers: {
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );
        return response.data.content[0].text;
    } catch (err) {
        console.error('❌ Claude text analysis error:', err.message);
        throw new Error('Failed to analyze text.');
    }
}

async function checkIfChartNeededWithClaude(text, history) {
    try {
        const systemPrompt = `You are an immigration onboarding assistant. If the user's question requires a statistical chart, respond with a JSON object: { needsChart: true, chartType: "bar|line|pie", dataNeeded: "Describe the data needed" }. Otherwise, respond with { needsChart: false }.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: text }
        ];
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 256,
                messages
            },
            {
                headers: {
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );
        const jsonMatch = response.data.content[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { needsChart: false };
    } catch (err) {
        console.error('❌ Claude chart check error:', err.message);
        return { needsChart: false };
    }
}

async function generateStatisticalChart(chartType, chartData, chartOptions = {}) {
    try {
        const width = 800;
        const height = 600;
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
        const config = {
            type: chartType,
            data: chartData,
            options: chartOptions
        };
        const buffer = await chartJSNodeCanvas.renderToBuffer(config);
        return buffer;
    } catch (err) {
        console.error('❌ Chart generation error:', err.message);
        throw new Error('Failed to generate chart.');
    }
}

async function sendWhatsAppMessage(to, body, mediaUrl = null) {
    try {
        const message = {
            from: TWILIO_WHATSAPP_NUMBER,
            to,
            body
        };
        if (mediaUrl) {
            message.mediaUrl = [mediaUrl];
        }
        await twilioClient.messages.create(message);
        console.log('✅ Response sent to', to);
    } catch (err) {
        console.error('❌ WhatsApp send error:', err.message);
    }
}

// ===================
// 3. CONVERSATION HISTORY
// ===================

function getHistory(phone) {
    return conversationHistory.get(phone) || [];
}

function addToHistory(phone, role, content) {
    const history = conversationHistory.get(phone) || [];
    history.push({ role, content });
    if (history.length > 20) history.splice(0, history.length - 20);
    conversationHistory.set(phone, history);
}

// ===================
// 4. WEBHOOK ENDPOINT
// ===================

app.post('/webhook/whatsapp', async (req, res) => {
    const { From, Body, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    const phone = From;
    console.log(`📱 New message from ${phone}`);

    try {
        if (NumMedia && parseInt(NumMedia) > 0 && MediaUrl0) {
            // Workflow A: Document Analysis
            console.log('📄 Processing image from user...');
            const imageBuffer = await downloadImage(MediaUrl0);
            const cloudinaryUrl = await uploadToCloudinary(imageBuffer, 'immigration-docs', `${phone}-${Date.now()}`);
            const base64Image = imageBuffer.toString('base64');
            console.log('🤖 Analyzing with Claude...');
            const history = getHistory(phone);
            const analysis = await analyzeImageWithClaude(base64Image, history);
            addToHistory(phone, 'user', '[Image uploaded]');
            addToHistory(phone, 'assistant', analysis);
            await sendWhatsAppMessage(phone, analysis, cloudinaryUrl);
            res.status(200).send('OK');
            return;
        }

        // Workflow B: Statistical Question
        const history = getHistory(phone);
        const chartCheck = await checkIfChartNeededWithClaude(Body, history);
        if (chartCheck.needsChart) {
            console.log('📊 Generating statistical chart...');
            // For demo, use dummy data. In production, fetch real data as needed.
            let chartData = {
                labels: ['2019', '2020', '2021', '2022', '2023'],
                datasets: [{
                    label: 'Immigrants',
                    data: [10000, 12000, 15000, 18000, 21000],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }]
            };
            if (chartCheck.dataNeeded) {
                // Optionally, fetch/generate data based on chartCheck.dataNeeded
            }
            const chartBuffer = await generateStatisticalChart(chartCheck.chartType, chartData);
            const chartUrl = await uploadToCloudinary(chartBuffer, 'immigration-stats', `${phone}-chart-${Date.now()}`);
            const explanation = `Here is the chart you requested.`;
            addToHistory(phone, 'user', Body);
            addToHistory(phone, 'assistant', explanation);
            await sendWhatsAppMessage(phone, explanation, chartUrl);
            res.status(200).send('OK');
            return;
        }

        // Workflow: Text-based Immigration Support
        console.log('🤖 Processing text question...');
        const answer = await analyzeTextWithClaude(Body, history);
        addToHistory(phone, 'user', Body);
        addToHistory(phone, 'assistant', answer);
        await sendWhatsAppMessage(phone, answer);
        res.status(200).send('OK');
    } catch (err) {
        console.error('❌ Error in webhook handler:', err.message);
        await sendWhatsAppMessage(phone, 'Sorry, something went wrong processing your request. Please try again.');
        res.status(200).send('OK');
    }
});

// ===================
// 5. HEALTH CHECK
// ===================

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ===================
// 6. SERVER STARTUP
// ===================

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Immigration Bot running on port ${PORT}`);
});
