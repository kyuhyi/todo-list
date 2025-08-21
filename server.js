const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Check if the API key is loaded
if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is not set in the .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).send({ error: 'Prompt is required' });
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
