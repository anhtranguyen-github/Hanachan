
import axios from 'axios';

async function fetchRawTranscript(videoId: string) {
    try {
        console.log(`Fetching page for ${videoId}...`);
        const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = response.data;
        const match = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (match) {
            const tracks = JSON.parse(match[1]);
            const jaTrack = tracks.find((t: any) => t.languageCode === 'ja');
            if (jaTrack) {
                const subResponse = await axios.get(jaTrack.baseUrl);
                const xml = subResponse.data as string;
                console.log(`Success! XML length: ${xml.length}`);

                // Find transcript around 6:01 (361 seconds)
                // XML format: <text start="123" dur="456">...</text>
                const regex = /<text start="(\d+\.?\d*)" dur="\d+\.?\d*".*?>(.*?)<\/text>/g;
                let m;
                while ((m = regex.exec(xml)) !== null) {
                    const start = parseFloat(m[1]);
                    if (start >= 355 && start <= 370) {
                        console.log(`[${Math.floor(start / 60)}:${Math.floor(start % 60)}] -> ${m[2]}`);
                    }
                }
            }
        }
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}

fetchRawTranscript("ZlvcqelxeSI");
