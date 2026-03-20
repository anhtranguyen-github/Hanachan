import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { advancedChatService } from '../src/features/chat/advanced-chatbot';
import { chatRepo } from '../src/features/chat/chat-repo';

async function debugChat() {
    const userId = 'a696806b-7eeb-4912-ba68-d1d50a5ce8fb'; // The seeded user
    const sessionId = '77777777-7777-7777-7777-777777777777';
    const message = "Who am I? And tell me about my Kanji 桜 progress.";

    console.log('--- DEBUG CHAT START ---');
    console.log(`User ID: ${userId}`);
    console.log(`Message: ${message}`);

    try {
        const result = await advancedChatService.sendMessage(sessionId, userId, message);
        console.log('--- RESULT ---');
        console.log(`Reply: ${result.reply}`);
        console.log(`Actions: ${JSON.stringify(result.actions, null, 2)}`);
        console.log(`Referenced KUs: ${JSON.stringify(result.referencedKUs, null, 2)}`);
    } catch (err: any) {
        console.error('--- ERROR ---');
        console.error(err);
    }
}

debugChat();
