
import { youtubeService } from '../src/features/youtube/service';
import { youtubeLearningService } from '../src/features/youtube/learning-service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runScenario() {
    const videoId = YOUTUBE_TEST_VIDEO.ID; // ZlvcqelxeSI

    console.log("🎬 === SCENARIO: YouTube Immersion Learning ===");
    console.log(`📺 Video: ${YOUTUBE_TEST_VIDEO.TITLE}`);

    // Step 1: Import Video (Fetching & Patching Transcript)
    console.log("\n--- STEP 1: IMPORTING VIDEO ---");
    await youtubeService.importVideo("test-user", YOUTUBE_TEST_VIDEO.URL);

    // Step 2: Simulate Playback @ 6:01
    const targetTimestamp = 361; // 6:01
    console.log(`\n--- STEP 2: PLAYBACK @ ${formatTime(targetTimestamp)} ---`);
    console.log("User pauses video to learn this sentence...");

    // Step 3: Analyze
    console.log("\n--- STEP 3: ANALYZING SENTENCE ---");
    try {
        const result = await youtubeLearningService.analyzeSegment(videoId, targetTimestamp);

        // Step 4: Display Results (Simulating UI)
        console.log("\n--- STEP 4: UI DISPLAY ---");
        console.log(`📝 Original: ${result.raw_text}`);
        console.log(`🇬🇧 Meaning:  ${result.translation}`);
        console.log(`🧩 Structure: ${result.explanation}`);

        console.log("\n📊 Furigana Breakdown:");
        result.units.forEach(u => {
            const status = u.is_in_ckb ? "✅" : "🆕";
            console.log(`  ${status} [${u.surface}] (${u.reading || '-'}) - ${u.pos}`);
        });

        console.log(`\n📈 Stats: You know ${result.coverage_stats.percentage}% of this sentence.`);

        console.log("\n💡 Grammar Points:");
        result.grammar_points.forEach(g => {
            console.log(`  - ${g.title}: ${g.meaning}`);
        });

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

function formatTime(s: number) {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

runScenario();
