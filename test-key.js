const { OpenAI } = require('openai');
require('dotenv').config();

async function testApiKey() {
    console.log("Testing OpenAI API key...");
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Say 'Success'" }],
            max_tokens: 5,
        });
        console.log("Response:", response.choices[0].message.content);
        console.log("API Key is working!");
    } catch (e) {
        console.error("API Key Test Failed!", e.message);
    }
}

testApiKey();
