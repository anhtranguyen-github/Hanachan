// import { aiSentenceAnalyzer, AIAnalysisResult } from "../analysis/ai-analyzer";
// import { tokenize } from "../analysis/tokenizer";
// import { processTokens, extractPotentialKUSlugs, AnalyzedUnit } from "../analysis/token-processor";
import { curriculumRepository } from "../knowledge/db";
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
        console.log(`Analyzing: ${text}`);

        // 1. Detect KUs from the text
        // For efficiency in this basic version, we just search for single characters 
        // that exist in the text in our KU database.
        const potentialKUs = Array.from(new Set(text.split('').filter(c => /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(c))));

        const units: AnalyzedUnit[] = [];
        for (const char of potentialKUs) {
            const { data } = await curriculumRepository.search(char);
            const exact = data?.find(k => k.character === char || k.slug.split(':')[1] === char);

            units.push({
                text: char,
                is_in_ckb: !!exact,
                ku_slug: exact?.slug
            });
        }

        return {
            translation: "Analysis of: " + text,
            grammar_points: [], // Still mock or can be improved later
            cloze_suggestion: units.length > 0 ? units[0].text : null,
            units: units,
            raw_text: text,
            coverage_stats: {
                total_units: text.length,
                known_units: units.length,
                percentage: (units.length / Math.max(text.length, 1)) * 100
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

