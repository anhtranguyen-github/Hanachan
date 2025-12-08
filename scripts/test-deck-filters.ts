
import { flashcardService } from '../src/features/deck/flashcard-service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function testDeckFiltering() {
    console.log("🃏 === TESTING DECK FILTERING ===\n");

    // 1. Get All YouTube Cards (across all videos)
    const allYoutube = flashcardService.getCardsBySource('youtube');
    console.log(`🎥 Total YouTube Cards: ${allYoutube.length}`);

    // 2. Get Specific Video Cards (Shirakawago)
    const shirakawaCards = flashcardService.getCardsBySource('youtube', YOUTUBE_TEST_VIDEO.ID);
    console.log(`🏯 Shirakawago Deck Count: ${shirakawaCards.length}`);

    if (shirakawaCards.length > 0) {
        console.log(`   Sample: "${shirakawaCards[0].front}"`);
    }

    // 3. Get Manual Cards (Should be 0 if we haven't added any yet)
    const manualCards = flashcardService.getCardsBySource('manual');
    console.log(`✍️ Manual Deck Count: ${manualCards.length}`);
}

testDeckFiltering();
