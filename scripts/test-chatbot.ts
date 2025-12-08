
import { aiChatbotService } from '../src/features/chat/chatbot-service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runChatSimulation() {
    const sessionId = `sim-session-${Date.now()}`;
    const userId = "dev-user-001";

    console.log("🌸 === HANA-CHAN AI TUTOR SIMULATION ===");

    // Test 1: Basic Greeting & Persona
    console.log("\n👤 User: Konnichiwa Hana-chan!");
    const reply1 = await aiChatbotService.sendMessage(sessionId, userId, "Konnichiwa Hana-chan!");
    console.log(`🤖 Hana: ${reply1}`);

    // Test 2: Project Awareness
    console.log("\n👤 User: Do you know what project I am working on?");
    const reply2 = await aiChatbotService.sendMessage(sessionId, userId, "Do you know what project I am working on?");
    console.log(`🤖 Hana: ${reply2}`);

    // Test 3: SRS / Quiz Context
    console.log("\n👤 User: I want to practice. Any suggestions?");
    const reply3 = await aiChatbotService.sendMessage(sessionId, userId, "I want to practice. Any suggestions?");
    console.log(`🤖 Hana: ${reply3}`);
}

runChatSimulation();
