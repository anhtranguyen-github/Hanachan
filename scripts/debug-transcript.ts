
import { YoutubeTranscript } from 'youtube-transcript';

async function debugTranscript() {
    try {
        console.log("Fetching all available transcript segments...");
        const transcript = await YoutubeTranscript.fetchTranscript("ApCnmHLHARM");
        console.log(`Total segments: ${transcript.length}`);

        const target = 361;
        const slice = transcript.filter(s => s.offset > target - 20 && s.offset < target + 20);

        slice.forEach(s => {
            const min = Math.floor(s.offset / 60);
            const sec = Math.floor(s.offset % 60).toString().padStart(2, '0');
            console.log(`[${min}:${sec}] (${s.offset}) -> ${s.text}`);
        });
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
debugTranscript();
