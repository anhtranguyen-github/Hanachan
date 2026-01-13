import { MOCK_ANALYSIS_RESULT } from "@/lib/data-mock";
import { AnalyzedUnit } from "./token-processor";
import { AIAnalysisResult } from "./ai-analyzer";

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
        // In real backend, we would use an AI tokenizer or keep kuromoji if necessary
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

    async mine() {
        // This is handled by mining action but could be here
        return null;
    }
}
}
export const sentenceService = new SentenceService();
