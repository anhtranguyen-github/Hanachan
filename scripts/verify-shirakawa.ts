
import { youtubeService } from '../src/features/youtube/service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function verify() {
    // 1. Import Video (uses Local Storage + Patching)
    console.log("🚀 Importing Shirakawago video...");
    await youtubeService.importVideo("test-user-id", YOUTUBE_TEST_VIDEO.URL);

    // 2. Retrieve from Local Storage
    const transcript = await youtubeService.getTranscript(YOUTUBE_TEST_VIDEO.ID);

    if (!transcript) {
        console.error("❌ No transcript found in local storage!");
        return;
    }

    // 3. Verify 6:01 (361s)
    const target = 361;
    const segments = transcript.filter(s => s.start <= target && (s.start + s.duration) >= target);

    console.log(`\n🔍 Checking timestamp ${target}s (6:01):`);
    if (segments.length > 0) {
        segments.forEach(s => {
            console.log(`✅ [${formatTime(s.start)}] -> ${s.text}`);
        });
    } else {
        console.log("❌ Segment NOT found!");
        // Print nearby
        const nearby = transcript.filter(s => Math.abs(s.start - target) < 10);
        console.log("Nearby segments:", nearby);
    }
}

function formatTime(s: number) {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

verify();
