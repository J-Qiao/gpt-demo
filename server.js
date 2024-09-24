import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createVectorStore } from './vectorStore.js';
import { createJudge } from './Judge.js';
import { createTherapist } from './Therapist.js';
import { createSolutions } from './Solutions.js';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

// Initialize the Express app
const app = express();

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON
app.use(express.json());

// Serve static files (HTML, JS, CSS)
app.use(express.static(__dirname));

// API endpoint to handle chatbot interaction
app.post('/chat', async (req, res) => {
    try {
        const userInput = req.body.userInput;
        const chatHistory = [
            new HumanMessage("Hello"),
            new AIMessage("Hi, how can I help you?"),
        ];
        chatHistory.push(new HumanMessage(userInput));

        const vectorStore = await createVectorStore();
        const chainJudge = await createJudge(vectorStore);

        const responseJudge = await chainJudge.invoke({
            input: "What should I do?",
            chat_history: chatHistory,
        });

        let responseText = '';

        if (responseJudge.answer.includes('No')) {
            const chainTherapist = await createTherapist(chatHistory);
            const responseTherapist = await chainTherapist.invoke({
                question: responseJudge.answer,
                chat_history: chatHistory,
            });
            responseText = responseTherapist;
        } else if (responseJudge.answer.includes('Yes')) {
            const chainSolutions = await createSolutions(vectorStore);
            const responseSolutions = await chainSolutions.invoke({
                input: "What should I do?",
                chat_history: chatHistory,
            });
            responseText = responseSolutions.answer;
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error("Error in chat logic:", error);
        res.status(500).send("An error occurred");
    }
});

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});