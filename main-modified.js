import { createVectorStore } from './vectorStore.js';
import { createJudge } from './Judge.js';
import { createTherapist } from './Therapist.js';
import { createSolutions } from './Solutions.js';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

// Function to add messages to the chat history on the webpage
const addToChatHistory = (input, response) => {
    const chatHistory = document.getElementById("chat-history");

    if (!chatHistory) {
        console.error("Chat history element not found.");
        return;
    }
    
    // Create new list items for the input and response
    const userInputElement = document.createElement('li');
    userInputElement.className = 'list-group-item';
    userInputElement.innerHTML = `<strong>You:</strong> ${input}`;

    const responseElement = document.createElement('li');
    responseElement.className = 'list-group-item';
    responseElement.innerHTML = `<strong>Bot:</strong> ${response}`;

    // Append input and response to the chat history
    chatHistory.appendChild(userInputElement);
    chatHistory.appendChild(responseElement);
};

// Main function to handle the conversation flow
export const main = async () => {
    try {
        console.log("Main function started...");
        
        // Wait until the DOM is fully loaded
        document.addEventListener('DOMContentLoaded', async () => {
            console.log("DOM fully loaded");

            // Create vector stores
            const vectorStore = await createVectorStore();
            console.log("Vector store created");

            // Initiate chat history
            const chatHistory = [
                new HumanMessage("Hello"),
                new AIMessage("Hi, how can I help you?"),
            ];

            // Handle form submission
            const submitButton = document.getElementById("submit");
            if (!submitButton) {
                console.error("Submit button not found.");
                return;
            }

            submitButton.onclick = async () => {
                const userInputElement = document.getElementById("user-input");
                const userInput = userInputElement ? userInputElement.value : '';

                if (!userInput) {
                    alert("Please enter a message.");
                    return;
                }

                // Add new user input to chat history
                chatHistory.push(new HumanMessage(userInput));
                console.log("User input added to chat history:", userInput);

                const chainJudge = await createJudge(vectorStore);
                console.log("Judge chain created");

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

                // Add AI response to chat history
                chatHistory.push(new AIMessage(responseText));
                console.log("AI response added to chat history:", responseText);

                // Display both user input and AI response on the webpage
                addToChatHistory(userInput, responseText);

                // Clear input field
                userInputElement.value = '';
            };
        });
    } catch (error) {
        console.error("Error in main function:", error);
    }
};

// Call main function
main();