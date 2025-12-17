
import { sentenceRepo } from '../src/features/sentence/sentence-repo';
import { flashcardService } from '../src/features/deck/flashcard-service';
import { analyticsService } from '../src/features/analytics/service';
import { advancedChatService } from '../src/features/chat/advanced-chatbot';
import { chatRepo } from '../src/features/chat/chat-repo';
import { createClient } from '@/services/supabase/server'; // Re-use our admin client

const TEST_SESSION = "integration-test-session";

async function getOrCreateTestUser(): Promise<string> {
    const supabase = createClient();

    // 1. Try to get any existing user
    // Note: auth.users is protected. We are using Service Role Key, so we can access auth.admin
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (users && users.length > 0) {
        console.log(`👤 Using existing Test User: ${users[0].email} (${users[0].id})`);
        return users[0].id;
    }

    // 2. Create new test user
    const email = `test-${Date.now()}@example.com`;
    console.log(`👤 Creating new Test User: ${email}`);
    const { data, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true
    });

    if (createError || !data.user) {
        throw new Error(`Failed to create test user: ${createError?.message}`);
    }

    // Ensure public.users trigger fired (wait a bit)
    await new Promise(r => setTimeout(r, 1000));
    return data.user.id;
}

async function runIntegrationTest() {
    console.log("🚀 STARTING FULL DB INTEGRATION TEST...\n");

    try {
        const TEST_USER = await getOrCreateTestUser();

        // 1. CHAT & MINING FLOW
        console.log("\n--- 1. Testing Chatbot Persistence & Mining ---");
        const text = "Analyze this: 猫が魚を食べました";

        // Note: The service needs to handle the session creation internally now.
        // We pass TEST_USER so the internal logic uses this valid ID to create session.
        const reply = await advancedChatService.sendMessage(TEST_SESSION, TEST_USER, text);

        // Wait for async persistence
        await new Promise(r => setTimeout(r, 2000));

        // Check Chat Persistence
        const session = await chatRepo.getSession(TEST_SESSION);
        if (session && session.messages.length >= 2) {
            console.log(`✅ Chat Persisted: ${session.messages.length} messages found in DB.`);
        } else {
            console.error("❌ Chat not saved to DB!");
        }

        // Check Auto-Mined Sentence
        const triggerMatch = reply.match(/\[ACTION_TRIGGER\]: (.*)/);
        let sentenceId = "";

        if (triggerMatch) {
            const payload = JSON.parse(triggerMatch[1]);
            sentenceId = payload.sentenceId;
            const savedSentence = await sentenceRepo.getById(sentenceId);
            if (savedSentence) {
                console.log(`✅ Sentence Saved to DB: ${savedSentence.source_type} (ID: ${sentenceId}) (Owner: ${savedSentence.user_id})`);
            } else {
                console.error("❌ Sentence missing in DB!");
            }
        }

        // 2. FLASHCARD CREATION
        if (sentenceId) {
            console.log("\n--- 2. Testing Flashcard Creation ---");
            const card = await flashcardService.createDerivedCard(
                sentenceId,
                'vocab',
                { front: "猫", back: "Cat", targetSlug: "猫" },
                TEST_USER
            );

            if (card) {
                console.log(`✅ Card Created in DB: ${card.id} (Type: ${card.card_type})`);

                // 3. SRS REVIEW & ANALYTICS
                console.log("\n--- 3. Testing Analytics Upsert ---");
                await flashcardService.submitReview(card.id, 3); // Good
                await analyticsService.logReview(true, true, TEST_USER);

                const dashboard = await analyticsService.getDashboardStats(TEST_USER);
                console.log("📊 Dashboard Stats from DB:", dashboard.daily);

                if (dashboard.daily.reviews > 0) {
                    console.log("✅ Analytics Logged Successfully!");
                } else {
                    console.error("❌ Analytics not updated.");
                }
            } else {
                console.error("❌ Failed to create card (likely RLS or User mismatch)");
            }
        }

    } catch (e) {
        console.error("💥 TEST FAILED:", e);
    }
    console.log("\n✨ INTEGRATION TEST COMPLETE.");
}

runIntegrationTest();
