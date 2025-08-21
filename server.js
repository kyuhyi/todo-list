const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Check if the API key is loaded
if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is not set in the .env file.");
    // Don't exit in production, just log the warning
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

let genAI;
if (process.env.GOOGLE_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
}

app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).send({ error: 'Prompt is required' });
        }

        if (!genAI) {
            return res.status(500).send({ error: 'AI service is not configured' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.send({ response: text });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).send({ error: 'Failed to generate content from AI' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
