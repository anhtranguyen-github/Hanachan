import { tokenize } from "./tokenize";
import { processTokens, extractPotentialKUSlugs, AnalyzedUnit } from "./token-processor";
import { aiSentenceAnalyzer, AIAnalysisResult } from "./ai-analyzer";
import { createClient } from "@/services/supabase/server";

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
        // Stage 1: Tokenization
        const rawTokens = await tokenize(text);

        // Stage 2: CKB Mapping
        const potentialSlugs = extractPotentialKUSlugs(text, rawTokens);
        const supabase = createClient();

        // Fetch existing KUs from DB
        const { data: existingKUs } = await supabase
            .from('knowledge_units')
            .select('slug')
            .in('slug', potentialSlugs);

        const ckbSlugs = new Set(existingKUs?.map(ku => ku.slug) || []);
        const units = processTokens(rawTokens, ckbSlugs);

        // Stage 3: AI Insight
        const aiResult = await aiSentenceAnalyzer.analyze(text);

        // Stage 4: Stats calculation
        const vocabUnits = units.filter(u => u.type === 'vocabulary' || u.type === 'kanji');
        const total_units = vocabUnits.length;
        const known_units = vocabUnits.filter(u => u.is_in_ckb).length;
        const percentage = total_units > 0 ? (known_units / total_units) * 100 : 0;

        return {
            ...aiResult,
            units,
            raw_text: text,
            coverage_stats: {
                total_units,
                known_units,
                percentage
            }
        };
    }

    async mine() {
        // This is handled by mining action but could be here
        return null;
    }
}
export const sentenceService = new SentenceService();
