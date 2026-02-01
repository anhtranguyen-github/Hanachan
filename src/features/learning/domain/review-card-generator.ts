/**
 * Review Card Generator
 * 
 * Implements the Unified Review RPD:
 * - Radical: Always meaning prompt
 * - Kanji: Randomly choose meaning OR reading prompt
 * - Vocabulary: Randomly choose meaning OR reading prompt
 * - Grammar: Always cloze prompt
 * 
 * All types use ONE FSRS state per KU.
 * Prompt difficulty affects grading context, not scheduling logic.
 */

import { supabase } from '@/lib/supabase';
import {
    ReviewCard,
    RadicalReviewCard,
    KanjiReviewCard,
    VocabReviewCard,
    GrammarReviewCard,
    PromptVariant
} from '../types/review-cards';
import { generateGrammarClozeCard } from './grammar-cloze';

const LOG_PREFIX = '[ReviewCardGenerator]';

interface KnowledgeUnit {
    id: string;
    slug: string;
    type: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
    level: number;
    character?: string;
    meaning: string;
    mnemonics?: any;
    // Joined sub-tables
    ku_radicals?: { name?: string };
    ku_kanji?: { meaning_data?: any; reading_data?: any; video?: string };
    ku_vocabulary?: { reading_primary?: string; parts_of_speech?: string[]; audio?: string; pitch?: any };
    ku_grammar?: { structure?: any; details?: string };
}

/**
 * Select prompt variant based on KU type
 * 
 * Rules (per RPD):
 * - Radical: ALWAYS meaning
 * - Kanji: 50/50 meaning or reading
 * - Vocabulary: 50/50 meaning or reading
 * - Grammar: ALWAYS cloze
 */
function selectPromptVariant(unitType: string): PromptVariant {
    switch (unitType) {
        case 'radical':
            return 'meaning';
        case 'kanji':
        case 'vocabulary':
            return Math.random() > 0.5 ? 'meaning' : 'reading';
        case 'grammar':
            return 'cloze';
        default:
            return 'meaning';
    }
}

/**
 * Generate a review card for any KU type using stored questions
 */
export async function generateReviewCard(
    ku: KnowledgeUnit,
    facet: PromptVariant,
    userId?: string
): Promise<ReviewCard | null> {
    console.log(`${LOG_PREFIX} Generating ${facet} card from DB for ${ku.type}: ${ku.character || ku.slug}`);

    // Fetch stored question
    const { data: question, error } = await supabase
        .from('questions')
        .select('*')
        .eq('ku_id', ku.id)
        .eq('facet', facet)
        .maybeSingle();

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching stored question:`, error);
        return null;
    }

    // Fallback if question not found (rare if seeded correctly)
    if (!question) {
        console.warn(`${LOG_PREFIX} No stored question found for ${ku.id} (${facet}). Falling back to manual.`);
        // Note: Manual fallback removed for strict stored question enforcement
        // return null;
    }

    // Common base
    const baseCard = {
        id: `${ku.id}-${facet}`,
        ku_id: ku.id,
        ku_type: ku.type,
        level: ku.level,
        character: ku.character,
        meaning: ku.meaning,
        prompt_variant: facet,
        prompt: question?.prompt,
        correct_answers: question?.correct_answers,
    };

    switch (ku.type) {
        case 'radical':
            return {
                ...baseCard,
                ku_type: 'radical',
                prompt_variant: 'meaning',
                radical_name: ku.ku_radicals?.name,
                mnemonic: ku.mnemonics?.meaning,
                image_url: ku.mnemonics?.image_url
            } as RadicalReviewCard;

        case 'kanji':
            const kanjiReadingData = ku.ku_kanji?.reading_data || {};
            return {
                ...baseCard,
                ku_type: 'kanji',
                prompt_variant: facet as 'meaning' | 'reading',
                readings: {
                    onyomi: kanjiReadingData.onyomi || [],
                    kunyomi: kanjiReadingData.kunyomi || [],
                    primary: kanjiReadingData.primary || kanjiReadingData.onyomi?.[0]
                },
                mnemonic_meaning: ku.mnemonics?.meaning,
                mnemonic_reading: ku.mnemonics?.reading
            } as KanjiReviewCard;

        case 'vocabulary':
            return {
                ...baseCard,
                ku_type: 'vocabulary',
                prompt_variant: facet as 'meaning' | 'reading',
                reading: ku.ku_vocabulary?.reading_primary || '',
                parts_of_speech: ku.ku_vocabulary?.parts_of_speech,
                audio_url: ku.ku_vocabulary?.audio,
                pitch: ku.ku_vocabulary?.pitch
            } as VocabReviewCard;

        case 'grammar':
            return {
                ...baseCard,
                ku_type: 'grammar',
                prompt_variant: 'cloze',
                sentence_ja: question?.cloze_text_with_blanks || '', // Or other source
                sentence_en: question?.hints?.[0],
                cloze_display: question?.cloze_text_with_blanks || '',
                cloze_answer: question?.correct_answers?.[0] || '',
                cloze_start_index: 0, // Not strictly used by UI anymore if cloze_display is provided
                cloze_end_index: 0,
                sentence_id: question?.id || 'manual',
                sentence_source: 'official'
            } as GrammarReviewCard;

        default:
            return null;
    }
}

/**
 * Generate review cards for a batch of (KU_ID, Facet) pairs
 */
export async function generateReviewCards(
    items: { unitId: string; facet: string }[],
    userId?: string
): Promise<ReviewCard[]> {
    console.log(`${LOG_PREFIX} Generating ${items.length} review cards from stored questions`);

    const unitIds = items.map(i => i.unitId);

    // Fetch all KUs with their data
    const { data: kus, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            ku_radicals(*),
            ku_kanji(*),
            ku_vocabulary(*),
            ku_grammar(*)
        `)
        .in('id', unitIds);

    if (error || !kus) {
        console.error(`${LOG_PREFIX} Error fetching KUs:`, error);
        return [];
    }

    // Generate cards for each item
    const cards: ReviewCard[] = [];
    for (const item of items) {
        const ku = kus.find(k => k.id === item.unitId);
        if (!ku) continue;

        const card = await generateReviewCard(
            ku as KnowledgeUnit,
            item.facet as PromptVariant,
            userId
        );

        if (card) {
            cards.push(card);
        }
    }

    return cards;
}
