
import { aiChatbotService } from '../src/features/chat/chatbot-service';
import { localChatRepo } from '../src/features/chat/local-db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyRouting() {
    const sessionId = `route-test-${Date.now()}`;
    const userId = "user-routing-01";

    // Seed Trouble Items
    localChatRepo.seedSRSData(userId, [{ kuId: "API", lapses: 5, difficulty: 10, state: "learning" }]);

    console.log("🌸 === ROUTING VERIFICATION ===");

    // 1. Project Query (Should inject Project Context)
    console.log("\n--- SCENARIO 1: PROJECT QUERY ---");
    const q1 = "What tech stack am I using?";
    const r1 = await aiChatbotService.sendMessage(sessionId, userId, q1);
    // Should mention Next.js/Supabase
    console.log(`User: ${q1}\nHana: ${r1}\n`);

    // 2. Study Request (Should suggest, NOT quiz)
    console.log("\n--- SCENARIO 2: VAGUE STUDY REQUEST ---");
    const q2 = "I want to study.";
    const r2 = await aiChatbotService.sendMessage(sessionId, userId, q2);
    // Should mention trouble items and ASK if user wants to quiz
    console.log(`User: ${q2}\nHana: ${r2}\n`);

    // 3. Quiz Command (Should Start Quiz)
    console.log("\n--- SCENARIO 3: QUIZ COMMAND ---");
    const q3 = "Quiz me on those items!";
    const r3 = await aiChatbotService.sendMessage(sessionId, userId, q3);
    // Should start Q1
    console.log(`User: ${q3}\nHana: ${r3}\n`);
}

verifyRouting();
