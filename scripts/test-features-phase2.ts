
import { kbService } from '../src/features/knowledge/kb-service';
import { refinementService } from '../src/features/sentence/refinement-service';
import { reverseLookupService } from '../src/features/knowledge/reverse-lookup';

async function testNewFeatures() {
    console.log("🚀 === TESTING NEW FEATURES ===\n");

    // 1. Knowledge Base (Browse/Filter)
    console.log("--- 1. KB BROWSE & BOOKMARK ---");
    kbService.seedMockData(); // Reset data

    // Bookmark "猫"
    kbService.toggleBookmark("猫");

    // Search N5 Vocabulary that is Bookmarked
    const results = kbService.search({ jlpt: 'N5', type: 'vocabulary' });
    const bookmarkedCat = results.find(r => r.slug === '猫');

    console.log(`Found 'Neko'? ${!!bookmarkedCat}`);
    console.log(`Is Bookmarked? ${bookmarkedCat?.userState?.isBookmarked}`);

    // 2. Reverse Lookup
    console.log("\n--- 2. REVERSE LOOKUP ---");
    // Assuming "きれい" exists in our Shirakawago transcript from previous steps
    const contexts = reverseLookupService.findContext("きれい");
    console.log(`Found '${contexts.length}' contexts for 'きれい'.`);
    if (contexts.length > 0) {
        console.log(`First match: [Video ${contexts[0].videoId} @ ${contexts[0].timestamp}s] "${contexts[0].segmentText}"`);
    }

    // 3. AI Refinement
    console.log("\n--- 3. AI REFINEMENT ---");
    const badSentence = "私は寿司を食べるのが好き。"; // Slightly casual/awkward depending on context
    const refined = await refinementService.refineSentence(badSentence);

    console.log(`Input: "${badSentence}"`);
    console.log(`Is Perfect? ${refined.is_perfect}`);
    console.log(`Correction: ${refined.corrected}`);
    console.log(`Golden: ${refined.golden_variation}`);
    console.log(`Reason: ${refined.explanation}`);
}

testNewFeatures();
