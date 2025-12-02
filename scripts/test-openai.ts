
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('❌ Error: OPENAI_API_KEY is not set in .env');
        process.exit(1);
    }

    console.log('Testing OpenAI connection...');
    const openai = new OpenAI({ apiKey });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say 'OpenAI Connected! Ready for Hana-chan V2.'" }],
            max_tokens: 20
        });

        console.log('✅ Connection Successful!');
        console.log('Response:', response.choices[0].message.content);
    } catch (error: any) {
        console.error('❌ OpenAI Connection Failed!');
        console.error('Error details:', error.message);
        if (error.status === 401) {
            console.error('Note: This is likely an invalid API Key.');
        } else if (error.status === 429) {
            console.error('Note: You have hit your quota or rate limit.');
        }
    }
}

testOpenAI();
