
import { videoLibraryService } from '../src/features/library/video-library';
import { flashcardService } from '../src/features/deck/flashcard-service';
import { analyticsService } from '../src/features/analytics/service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function testCoreManagement() {
    console.log("🛠️  === CORE MANAGEMENT MODULES TEST ===\n");

    // 1. Library: Import Video
    console.log("--- 1. VIDEO LIBRARY ---");
    videoLibraryService.addVideo({
        id: YOUTUBE_TEST_VIDEO.ID,
        title: YOUTUBE_TEST_VIDEO.TITLE,
        thumbnailUrl: "https://img.youtube.com/...",
        duration: 600,
        status: 'learning',
        progress: 10,
        addedAt: new Date().toISOString()
    });

    const videos = videoLibraryService.listVideos();
    console.log(`Video List (${videos.length}):`, videos.map(v => `${v.title} [${v.progress}%]`));

    // 2. Deck: Mine a Card
    console.log("\n--- 2. MINING & DECK ---");
    flashcardService.createCard({
        front: "猫が魚を食べました",
        back: "The cat ate the fish.",
        sourceType: 'youtube',
        sourceId: YOUTUBE_TEST_VIDEO.ID
    });

    let due = flashcardService.getDueCards();
    console.log(`Due Cards: ${due.length} items`);

    if (due.length > 0) {
        const card = due[0];
        console.log(`Simulating Review for: ${card.front}`);
        flashcardService.submitReview(card.id, 3); // Rated 'Good'
    }

    // 3. Analytics Dashboard
    console.log("\n--- 3. DASHBOARD ANALYTICS ---");
    const stats = analyticsService.getDashboardStats();
    console.table(stats.learning);
    console.table(stats.library);
}

testCoreManagement();
