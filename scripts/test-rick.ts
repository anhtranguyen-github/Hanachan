
import { YoutubeTranscript } from 'youtube-transcript';

async function testRickRoll() {
    try {
        console.log("Testing with a famous video (RickRoll)...");
        const t = await YoutubeTranscript.fetchTranscript("dQw4w9WgXcQ");
        console.log(`Success! Found ${t.length} segments.`);
    } catch (e: any) {
        console.log("Failure:", e.message);
    }
}
testRickRoll();
