import { MOCK_ANALYSIS_RESULT } from "@/lib/mock-db/seeds";
import { AnalyzedUnit } from "../analysis/token-processor";
import { AIAnalysisResult } from "../analysis/ai-analyzer";

export interface FullAnalysisResult extends AIAnalysisResult {
    units: AnalyzedUnit[];
    raw_text: string;
    coverage_stats: {
        total_units: number;
        known_units: number;
        percentage: number;
    };
}

export class SentenceService {
    async analyze(text: string): Promise<FullAnalysisResult> {
        console.log(`[Mock] Analyzing: ${text}`);

        // Return mock data for frontend development
        return {
            ...MOCK_ANALYSIS_RESULT,
            raw_text: text, // Echo back input
            cloze_suggestion: {
                text: text.replace("聴く", "[聴く]"), // Simple mock behavior
                cloze_index: 0
            },
            // Ensure types match
            units: MOCK_ANALYSIS_RESULT.units as unknown as AnalyzedUnit[]
        };
    }

    async mine(text: string, userId: string) {
        console.log(`[Mock] Mining sentence for user ${userId}: ${text}`);
        return { success: true, sentenceId: 'mock-s-' + Math.random().toString(36).substr(2, 5) };
    }
}

export const sentenceService = new SentenceService();
