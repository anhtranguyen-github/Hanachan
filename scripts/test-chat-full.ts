
import { aiChatbotService } from '../src/features/chat/chatbot-service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testFullChatFlow() {
    const sessionId = `full-flow-${Date.now()}`;
    const userId = "dev-user-003";

    console.log("🌸 === HANA-CHAN FULL FLOW TEST ===");

    // 1. Normal Chat
    console.log("\n--- TEST 1: NORMAL CHAT ---");
    console.log("👤 User: Konnichiwa!");
    const r1 = await aiChatbotService.sendMessage(sessionId, userId, "Konnichiwa!");
    console.log(`🤖 Hana: ${r1}`);

    // 2. Quiz Request
    console.log("\n--- TEST 2: QUIZ INTENT ---");
    console.log("👤 User: Give me a quick quiz.");
    const r2 = await aiChatbotService.sendMessage(sessionId, userId, "Give me a quick quiz.");
    console.log(`🤖 Hana: ${r2}`);

    // 3. Analysis Request (Integration Test!)
    console.log("\n--- TEST 3: ANALYSIS INTEGRATION ---");
    const sentence = "猫が魚を食べました。";
    console.log(`👤 User: Analyze this: ${sentence}`);
    const r3 = await aiChatbotService.sendMessage(sessionId, userId, `Analyze this: ${sentence}`);

    console.log("\n🤖 Hana (Analysis Result):");
    console.log(r3);
}

testFullChatFlow();
