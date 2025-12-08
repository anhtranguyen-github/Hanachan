
import { getSubtitles } from 'youtube-captions-scraper';

async function tryAutoJa() {
    const videoId = "ZlvcqelxeSI";
    try {
        console.log(`Trying 'a.ja' (auto) for ${videoId}...`);
        const captions = await getSubtitles({
            videoID: videoId,
            lang: 'a.ja' // This often works for auto-generated
        });
        if (captions && captions.length > 0) {
            console.log(`✅ Success with a.ja! Found ${captions.length} segments.`);
            return;
        }
    } catch (e: any) {
        console.log(`❌ Failed: ${e.message}`);
    }

    try {
        console.log(`Trying 'en' for ${videoId}...`);
        const captions = await getSubtitles({
            videoID: videoId,
            lang: 'en'
        });
        if (captions && captions.length > 0) {
            console.log(`✅ Success with en! Found ${captions.length} segments.`);
            return;
        }
    } catch (e: any) {
        console.log(`❌ Failed: ${e.message}`);
    }
}

tryAutoJa();
