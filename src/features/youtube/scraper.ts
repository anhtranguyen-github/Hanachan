import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
    text: string;
    duration: number;
    offset: number;
}

export class YoutubeScraper {

    async fetchTranscript(videoId: string, lang: string = 'ja'): Promise<TranscriptSegment[]> {
        console.log(`📡 Fetching transcript for ${videoId}...`);

        const langAttempts = ['ja', 'ja-JP', 'ja-jp', 'jp'];

        for (const l of langAttempts) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: l });
                if (transcript && transcript.length > 0) {
                    console.log(`✅ Success with lang: ${l}`);
                    return this.normalize(transcript);
                }
            } catch (e) {
                // Continue to next attempt
            }
        }

        try {
            // Final fallback: Let the library decide (usually gets primary or auto-generated)
            console.log(`📡 Final fallback: Auto-fetching best available transcript...`);
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            return this.normalize(transcript);
        } catch (finalError) {
            console.error("❌ All transcript fetch attempts failed for:", videoId);
            return [];
        }
    }

    private normalize(transcript: any[]) {
        return transcript.map(item => ({
            text: item.text,
            duration: item.duration,
            offset: item.offset
        }));
    }

    extractVideoId(url: string): string | null {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}

export const youtubeScraper = new YoutubeScraper();
