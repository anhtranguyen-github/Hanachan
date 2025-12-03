
import fs from 'fs';
import path from 'path';
import { YoutubeService, youtubeService } from './service';
import { sentenceService, ComprehensiveAnalysis } from '../sentence/service';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ANALYSES_FILE = path.join(DATA_DIR, 'analyses.json');

export class YouTubeLearningService {

    private loadAnalyses(): Record<string, ComprehensiveAnalysis> {
        if (!fs.existsSync(ANALYSES_FILE)) return {};
        try {
            return JSON.parse(fs.readFileSync(ANALYSES_FILE, 'utf-8'));
        } catch { return {}; }
    }

    private saveAnalyses(data: Record<string, ComprehensiveAnalysis>) {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ANALYSES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Analyzes a specific segment from a video's transcript.
     * Caches results to avoid redundant AI calls.
     */
    async analyzeSegment(videoId: string, timestamp: number): Promise<ComprehensiveAnalysis> {
        // 1. Get Transcript
        const transcript = await youtubeService.getTranscript(videoId);
        if (!transcript) throw new Error(`Transcript not found for video ${videoId}`);

        // 2. Find Segment
        const segment = transcript.find(s => s.start <= timestamp && (s.start + s.duration) >= timestamp);
        if (!segment) throw new Error(`No segment found at timestamp ${timestamp}`);

        const text = segment.text;
        const cacheKey = `${videoId}_${Math.floor(segment.start)}`;

        // 3. Check Cache
        const analyses = this.loadAnalyses();
        if (analyses[cacheKey]) {
            console.log(`⚡ [Cache Hit] Returning existing analysis for: "${text.substring(0, 20)}..."`);
            return analyses[cacheKey];
        }

        // 4. Run Analysis (Real AI)
        console.log(`🤖 [AI Analysis] Processing: "${text}"`);
        const result = await sentenceService.analyze(text);

        // 5. Save to Local Cache
        analyses[cacheKey] = result;
        this.saveAnalyses(analyses);

        return result;
    }
}

export const youtubeLearningService = new YouTubeLearningService();
