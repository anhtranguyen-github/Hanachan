
import { ChatOpenAI } from "@langchain/openai";

/**
 * Global OpenAI Client Configuration
 */
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
    throw new Error("Missing OPENAI_API_KEY environment variable");
}

export const openai = new ChatOpenAI({
    openAIApiKey: apiKey || "mock-key",
    modelName: "gpt-4-turbo-preview",
    temperature: 0.7,
});
