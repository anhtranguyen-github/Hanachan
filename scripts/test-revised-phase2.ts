
import { kbService } from '../src/features/knowledge/kb-service';
import { refinementService } from '../src/features/sentence/refinement-service';
import { flashcardService } from '../src/features/deck/flashcard-service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function testRevisedFlow() {
    console.log("🚀 === TESTING REVISED LOGIC (NO REVERSE LOOKUP) ===\n");

    // 1. Knowledge Base (Browse & Bookmark)
    console.log("--- 1. KB ACTIONS ---");
    kbService.seedMockData();
    kbService.toggleBookmark("猫");
    console.log(`Bookmark Toggled for 'Neko'.`);

    // 2. Mining with Precise Context (The Replacement for Reverse Lookup)
    console.log("\n--- 2. PRECISE MINING ---");
    // Instead of searching LATER, we save the context NOW.
    flashcardService.createCard({
        front: "ここは白川郷です",
        back: "This is Shirakawago.",
        sourceType: 'youtube',
        sourceId: YOUTUBE_TEST_VIDEO.ID,
        timestamp: 361 // Saved the exact moment!
    });

    // Future Usage: When user reviews this card, Frontend simply reads card.timestamp
    // and calls player.seekTo(361). Zero search overhead.

    // 3. AI Refinement (Still Valid)
    console.log("\n--- 3. AI REFINEMENT ---");
    const badSentence = "私は寿司を食べるのが好き。";
    const refined = await refinementService.refineSentence(badSentence);
    console.log(`Golden Variation: ${refined.golden_variation}`);
}

testRevisedFlow();
