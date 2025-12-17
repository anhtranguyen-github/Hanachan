
import { sentenceRepo } from '../src/features/sentence/sentence-repo-local';
import { flashcardService } from '../src/features/deck/flashcard-service';
import { analyticsService } from '../src/features/analytics/service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function testFinalArchitecture() {
    console.log("🧬 === TESTING FINAL ARCHITECTURE (LOCAL) ===\n");

    // 1. Mine Root Sentence
    console.log("--- 1. MINING ROOT SENTENCE ---");
    const root = sentenceRepo.addSentence({
        text: "猫が魚を食べました",
        translation: "The cat ate the fish.",
        sourceType: 'youtube',
        sourceId: YOUTUBE_TEST_VIDEO.ID,
        timestamp: 120
    });
    console.log(`✅ Root ID: ${root.id}`);

    // 2. Create Derivative Cards
    console.log("\n--- 2. CREATING DERIVATIVES ---");

    // A. Vocab Card (Target: Neko)
    flashcardService.createDerivedCard(root.id, 'vocab', {
        front: "猫",
        back: "Cat",
        targetSlug: "猫"
    });

    // B. Cloze Card (Target: wo - Particle)
    flashcardService.createDerivedCard(root.id, 'cloze', {
        front: "猫が魚 [___] 食べました",
        back: "を (Object Marker)",
        targetSlug: "を"
    });

    // 3. Simulate Review & Stats
    console.log("\n--- 3. REVIEW & STATS ---");
    const due = flashcardService.getDueCards();
    if (due.length > 0) {
        const card = due[0];
        console.log(`Reviewing: ${card.front} (${card.type})`);
        flashcardService.submitReview(card.id, 3); // Good
        analyticsService.logReview(true, true); // New Card, Correct
    }

    // 4. Check Analytics
    const stats = analyticsService.getDashboardStats();
    console.log("\n--- DASHBOARD ---");
    console.log("Daily Stats:", stats.daily);
}

testFinalArchitecture();
