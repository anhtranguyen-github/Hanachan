
export interface TranscriptSegment {
    text: string;
    duration: number;
    offset: number;
}

export class YoutubeScraper {

    async fetchTranscript(videoId: string, lang: string = 'ja'): Promise<TranscriptSegment[]> {
        console.log(`📡 [MOCK] Fetching transcript for ${videoId} (Lang: ${lang})...`);

        // Return a mock transcript
        return [
            { text: "This is a mock transcript.", duration: 2000, offset: 0 },
            { text: "Actual YouTube fetching is disabled.", duration: 3000, offset: 2000 },
            { text: "To enable, integrate a backend proxy.", duration: 3000, offset: 5000 }
        ];
    }

    extractVideoId(url: string): string | null {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}

export const youtubeScraper = new YoutubeScraper();
