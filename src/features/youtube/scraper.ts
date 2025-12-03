
import { YoutubeTranscript } from 'youtube-transcript';
import { getSubtitles } from 'youtube-captions-scraper';

export interface TranscriptSegment {
    text: string;
    duration: number;
    offset: number;
}

export class YoutubeScraper {

    async fetchTranscript(videoId: string, lang: string = 'ja'): Promise<TranscriptSegment[]> {
        console.log(`📡 Fetching transcript for ${videoId} (Lang: ${lang})...`);

        let segments: TranscriptSegment[] = [];

        // Strategy 1: youtube-transcript (Official/Public captions)
        try {
            console.log('   Trying Strategy 1: youtube-transcript...');
            const result = await YoutubeTranscript.fetchTranscript(videoId, { lang });
            if (result && result.length > 0) {
                console.log(`   ✅ Strategy 1 success: ${result.length} lines.`);
                return result.map(s => ({
                    text: this.cleanText(s.text),
                    duration: s.duration,
                    offset: s.offset
                }));
            }
        } catch (e) {
            console.log('   Strategy 1 failed.');
        }

        // Strategy 2: youtube-captions-scraper (Hidden/Auto-generated)
        // Try standard 'ja' first, then 'a.ja' (auto-generated)
        const langCandidates = [lang, 'a.ja', 'ja-JP'];

        for (const l of langCandidates) {
            try {
                console.log(`   Trying Strategy 2 with lang '${l}'...`);
                // @ts-ignore
                const captions = await getSubtitles({ videoID: videoId, lang: l });
                if (captions && captions.length > 0) {
                    console.log(`   ✅ Strategy 2 success (${l}): ${captions.length} lines.`);
                    return captions.map((t: any) => ({
                        text: this.cleanText(t.text),
                        duration: parseFloat(t.dur),
                        offset: parseFloat(t.start)
                    }));
                }
            } catch (e) {
                // Continue to next candidate
            }
        }

        // If specific test video ZlvcqelxeSI and we still failed (or even if we succeeded but want to be safe per user request)
        // We might want to throw or return partial. 
        // But the user asked to "Make sure 6:01 transcript is..."

        if (segments.length === 0) {
            throw new Error(`Could not fetch transcript for ${videoId} in Japanese.`);
        }

        return segments;
    }

    private cleanText(text: string): string {
        return text
            .replace(/\[.*?\]/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n/g, ' ')
            .trim();
    }

    extractVideoId(url: string): string | null {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}

export const youtubeScraper = new YoutubeScraper();
