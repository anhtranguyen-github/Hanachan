
import { getSubtitles } from 'youtube-captions-scraper';

async function bruteForceTranscript() {
    const videoId = "ZlvcqelxeSI";
    const langs = ['ja', 'en', 'ja-JP', 'a.ja', 'zh-TW'];

    console.log(`Searching for transcripts for ${videoId}...`);

    for (const lang of langs) {
        try {
            console.log(`Trying language: ${lang}`);
            const captions = await getSubtitles({
                videoID: videoId,
                lang: lang
            });
            if (captions && captions.length > 0) {
                console.log(`✅ FOUND! Language: ${lang} - Found ${captions.length} segments.`);
                console.log(`First segment: ${captions[0].text}`);
                return;
            }
        } catch (e: any) {
            console.log(`❌ Failed for ${lang}: ${e.message}`);
        }
    }
    console.log("No transcripts found with any of the attempted language codes.");
}

bruteForceTranscript();
