
import { getSubtitles } from 'youtube-captions-scraper';

async function debugJa() {
    const videoId = "ZlvcqelxeSI";
    try {
        console.log(`Deep check for 'ja' on ${videoId}...`);
        const captions = await getSubtitles({
            videoID: videoId,
            lang: 'ja'
        });
        console.log("Raw output type:", typeof captions);
        console.log("Is array?", Array.isArray(captions));
        console.log("Length:", captions?.length);
        console.log("Content:", JSON.stringify(captions).slice(0, 100));
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
debugJa();
