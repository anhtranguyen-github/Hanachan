
import { advancedChatService } from '../src/features/chat/advanced-chatbot';
import { localChatRepo } from '../src/features/chat/local-db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runRealTest() {
    const sessionId = `real-test-${Date.now()}`;
    const userId = "real-user-001";

    // Seed Data
    localChatRepo.seedSRSData(userId, [
        { kuId: "敬語 (Keigo)", lapses: 8, difficulty: 10, state: "learning" },
        { kuId: "jlpt-n4-grammar", lapses: 4, difficulty: 8, state: "learning" }
    ]);

    console.log("🌸 === HANA-CHAN ADVANCED REAL TEST ===");

    // 1. General Chat (Persona Check)
    console.log("\n--- TEST 1: GENERAL CHAT ---");
    console.log("👤 User: Hello Hana, I feel tired today.");
    const r1 = await advancedChatService.sendMessage(sessionId, userId, "Hello Hana, I feel tired today.");
    console.log(`🤖 Hana: ${r1}`);

    // 2. Study Request (Recommendation Check)
    console.log("\n--- TEST 2: VAGUE STUDY REQUEST ---");
    console.log("👤 User: Help me study something hard.");
    const r2 = await advancedChatService.sendMessage(sessionId, userId, "Help me study something hard.");
    console.log(`🤖 Hana: ${r2}`);

    // 3. Quiz Start (SRS Logic Check)
    console.log("\n--- TEST 3: QUIZ START ---");
    console.log("👤 User: Okay, quiz me on Keigo.");
    const r3 = await advancedChatService.sendMessage(sessionId, userId, "Okay, quiz me on Keigo.");
    console.log(`🤖 Hana: ${r3}`);

    // 4. Analysis (Service Integration Check)
    console.log("\n--- TEST 4: ANALYSIS ---");
    const sent = "先生にお土産を差し上げました。"; // Keigo example matching trigger
    console.log(`👤 User: Analyze: ${sent}`);
    const r4 = await advancedChatService.sendMessage(sessionId, userId, `Analyze: ${sent}`);
    console.log(`🤖 Hana:\n${r4}`);
}

runRealTest();
