
import { advancedChatService } from '../src/features/chat/advanced-chatbot.ts';
import { sentenceRepo } from '../src/features/sentence/sentence-repo-local.ts';

async function testChatTrigger() {
    console.log("💬 === TESTING CHAT MINING TRIGGER ===\n");

    const sessionId = "chat-trigger-test";
    const userId = "dev-user";
    const text = "Analyze this: 猫が魚を食べました";

    // 1. Send Message
    console.log(`User: ${text}`);
    const botReply = await advancedChatService.sendMessage(sessionId, userId, text);

    // 2. Parsed Output
    console.log("\nBot Reply (Raw):");
    console.log(botReply.substring(0, 100) + "..."); // truncated

    // 3. Check for Trigger
    const triggerMatch = botReply.match(/\[ACTION_TRIGGER\]: (.*)/);
    if (triggerMatch) {
        const payload = JSON.parse(triggerMatch[1]);
        console.log("\n✅ TRIGGER DETECTED:");
        console.log(payload);

        // 4. Verify Sentence Saved
        const sentence = sentenceRepo.getById(payload.sentenceId);
        console.log(`\n🔍 Verifying Repository: Found Sentence? ${!!sentence}`);
        if (sentence) {
            console.log(`   Source: ${sentence.sourceType}`);
            console.log(`   Text: ${sentence.text}`);
        }
    } else {
        console.log("❌ No trigger found in response.");
    }
}

testChatTrigger();
