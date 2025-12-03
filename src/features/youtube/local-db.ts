
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TRANSCRIPT_FILE = path.join(DATA_DIR, 'transcripts.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface LocalSegment {
    start: number;
    duration: number;
    text: string;
}

export interface LocalTranscript {
    videoId: string;
    segments: LocalSegment[];
    updatedAt: string;
}

export class LocalTranscriptRepository {
    private load(): Record<string, LocalTranscript> {
        if (!fs.existsSync(TRANSCRIPT_FILE)) return {};
        try {
            return JSON.parse(fs.readFileSync(TRANSCRIPT_FILE, 'utf-8'));
        } catch {
            return {};
        }
    }

    private save(data: Record<string, LocalTranscript>) {
        fs.writeFileSync(TRANSCRIPT_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    saveTranscript(videoId: string, segments: LocalSegment[]) {
        const data = this.load();
        data[videoId] = {
            videoId,
            segments,
            updatedAt: new Date().toISOString()
        };
        this.save(data);
    }

    getTranscript(videoId: string): LocalSegment[] | null {
        const data = this.load();
        return data[videoId]?.segments || null;
    }
}

export const localTranscriptRepo = new LocalTranscriptRepository();
