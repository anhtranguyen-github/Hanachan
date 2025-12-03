
import * as db from './db';
import { kuRepository } from '../knowledge/db';
import { tokenize } from './tokenizer';
import { extractPotentialKUSlugs, processTokens, AnalyzedUnit } from './token-processor';
import { aiSentenceAnalyzer, AIAnalysisResult } from './ai-analyzer';
import { Sentence, KUToSentence } from './types';

export interface ComprehensiveAnalysis extends AIAnalysisResult {
    units: AnalyzedUnit[];
    raw_text: string;
    coverage_stats: {
        total_units: number;
        known_units: number;
        percentage: number;
    };
    existing_grammar_slugs: string[];
}

export class SentenceService {
    /**
     * Stage 1 -> 2 -> 3 orchestration with stats calculation.
     */
    async analyze(text: string): Promise<ComprehensiveAnalysis> {
        // 1. Stage 1: Local Tokenization
        const tokens = await tokenize(text);

        // 2. Stage 2: CKB Mapping
        const potentialSlugs = extractPotentialKUSlugs(text, tokens);
        const existingSlugs = await kuRepository.checkSlugsExist(potentialSlugs);
        const units = processTokens(tokens, existingSlugs);

        // 3. Stage 3: AI Insight
        const aiResult = await aiSentenceAnalyzer.analyze(text);

        // 4. Grammar Mapping: Check if AI suggested grammar exists in our DB
        const aiGrammarSlugs = aiResult.grammar_points
            .map(g => g.slug)
            .filter((s): s is string => !!s);
        const existingGrammar = await kuRepository.checkSlugsExist(aiGrammarSlugs);

        // 5. Calculate Stats
        const importantUnits = units.filter(u => u.type === 'vocabulary' || u.type === 'kanji');
        const knownUnits = importantUnits.filter(u => u.is_in_ckb).length;
        const totalUnits = importantUnits.length;
        const percentage = totalUnits > 0 ? Math.round((knownUnits / totalUnits) * 100) : 100;

        return {
            ...aiResult,
            units,
            raw_text: text,
            coverage_stats: {
                total_units: totalUnits,
                known_units: knownUnits,
                percentage
            },
            existing_grammar_slugs: Array.from(existingGrammar)
        };
    }

    async refine(text: string) {
        return await aiSentenceAnalyzer.refine(text);
    }

    /**
     * Stage 4: Smart Mining
     */
    async mine(params: {
        userId: string;
        text_ja: string;
        text_en: string;
        cloze_positions?: number[];
        source_type: string;
        source_id?: string;
        selected_ku_slugs: string[];
    }): Promise<Sentence | null> {
        // 1. Save sentence
        const sentence = await db.createSentence({
            user_id: params.userId as any,
            text_ja: params.text_ja,
            text_en: params.text_en,
            text_tokens: { cloze_positions: params.cloze_positions },
            source_type: params.source_type,
            source_metadata: params.source_id ? { id: params.source_id } : {}
        });

        if (!sentence) return null;

        // 2. Link KUs (Sentence Mining)
        for (const slug of params.selected_ku_slugs) {
            await db.linkKUToSentence({
                ku_id: slug,
                sentence_id: sentence.id!,
                is_primary: true, // simplified
                cloze_positions: params.cloze_positions
            });
        }

        return sentence;
    }
}

export const sentenceService = new SentenceService();
