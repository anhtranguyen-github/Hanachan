
import { aiChatbotService } from '../src/features/chat/chatbot-service';
import { localChatRepo } from '../src/features/chat/local-db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runAdvancedSimulation() {
    const sessionId = `adv-session-${Date.now()}`;
    const userId = "dev-user-002";

    console.log("🌸 === HANA-CHAN AI TUTOR (ADVANCED) ===");

    // 1. Seed SRS Data (Simulate "Trouble Items")
    console.log("⚙️  Seeding SRS Data...");
    localChatRepo.seedSRSData(userId, [
        { kuId: "難しい (Muzukashii)", lapses: 5, difficulty: 9, state: "learning" },
        { kuId: "簡単 (Kantan)", lapses: 0, difficulty: 2, state: "mastered" },
        { kuId: "文法 (Bunpou)", lapses: 4, difficulty: 8, state: "learning" }
    ]);

    // 2. Chat: Context Awareness Test
    console.log("\n👤 User: I want to study. What should I focus on?");
    const reply = await aiChatbotService.sendMessage(sessionId, userId, "I want to study. What should I focus on?");
    console.log(`🤖 Hana: ${reply}`);

    // Verification Logic
    if (reply.includes("難しい") || reply.includes("文法")) {
        console.log("\n✅ SUCCESS: Hana identified the trouble items!");
    } else {
        console.log("\n⚠️ WARNING: Hana might have missed the SRS context.");
    }
}

runAdvancedSimulation();
