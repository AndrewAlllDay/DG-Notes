// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key (replace with your actual key or environment variable)
const API_KEY = "AIzaSyBkDCCnNrpLp4dqx_j4xMAb9u2-p3lH8Sc"; // <-- Replace this with your actual key

// For better security, especially in a production environment, you should
// consider using server-side calls or environment variables that are
// not directly exposed in client-side code. For development and learning,
// directly placing it here is acceptable but be mindful of exposing it.

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// After
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
// You can also try other models if 'gemini-pro' continues to give 404
// For example, some users might need 'models/gemini-pro' depending on their setup,
// or 'gemini-pro-text' or similar if they were using an older API structure.
// However, 'gemini-pro' is the correct direct model ID for the gen-ai npm package.
// If this still fails, it strongly suggests a problem with the API key's permissions
// or the region it was created in, or a temporary API issue.

// Function to generate text from a prompt
export async function generateText(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error generating text with Gemini:", error);
        throw new Error("Failed to generate text. Please try again.");
    }
}

// You can also expose the model directly if you plan to do more complex interactions
// export { model };