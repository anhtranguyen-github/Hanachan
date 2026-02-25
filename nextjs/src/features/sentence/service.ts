// import { aiSentenceAnalyzer, AIAnalysisResult } from "../analysis/ai-analyzer";
// import { tokenize } from "../analysis/tokenizer";
// import { processTokens, extractPotentialKUSlugs, AnalyzedUnit } from "../analysis/token-processor";
import { kuRepository } from "../knowledge/db";
import { sentenceRepository } from "./db";

// Placeholder types to replace deleted analysis modules
export interface AnalyzedUnit {
    text: string;
    is_in_ckb: boolean;
    ku_slug?: string;
}

export interface AIAnalysisResult {
    translation: string;
    grammar_points: Array<{ title: string; usage: string }>;
    cloze_suggestion: string | null;
}

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
        console.log(`Analyzing (Mock): ${text}`);

        // Mock Result since Analysis feature was removed
        return {
            translation: "[Translation Unavailable - Analysis Module Removed]",
            grammar_points: [],
            cloze_suggestion: null,
            units: [],
            raw_text: text,
            coverage_stats: {
                total_units: 0,
                known_units: 0,
                percentage: 0
            }
        };
    }

    async mine(text: string, userId: string, preAnalysis?: FullAnalysisResult) {
        console.log(`Mining sentence for user ${userId}: ${text}`);

        // Use pre-analysis if provided, otherwise run analysis
        const analysis = preAnalysis || await this.analyze(text);

        try {
            const result = await sentenceRepository.create({
                text_ja: text,
                text_en: analysis.translation,
                origin: 'user',
                created_by: userId,
                metadata: {
                    grammar_points: analysis.grammar_points,
                    ai_cloze: analysis.cloze_suggestion
                }
            });

            // Logic to link KUs is largely dependent on analysis results which are now empty.
            // Keeping the structure but it won't find anything without the tokenizer.

            return { success: !!result, sentenceId: result?.id };
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    }
}

export const sentenceService = new SentenceService();

