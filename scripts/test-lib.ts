
import { YoutubeTranscript } from 'youtube-transcript';

async function testLib() {
    try {
        console.log("Testing youtube-transcript with default settings...");
        const t = await YoutubeTranscript.fetchTranscript("ZlvcqelxeSI");
        console.log("Success! Count:", t.length);
    } catch (e: any) {
        console.log("Failure:", e.message);
    }
}
testLib();
