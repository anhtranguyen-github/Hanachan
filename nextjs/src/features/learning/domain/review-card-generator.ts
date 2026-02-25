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
function selectPromptVariant(kuType: string): PromptVariant {
    switch (kuType) {
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
 * Generate a review card for any KU type
 */
export async function generateReviewCard(
    ku: KnowledgeUnit,
    userId?: string,
    recentGrammarSentences?: string[]
): Promise<ReviewCard | null> {
    const variant = selectPromptVariant(ku.type);
    console.log(`${LOG_PREFIX} Generating ${variant} card for ${ku.type}: ${ku.character || ku.slug}`);

    switch (ku.type) {
        case 'radical':
            return generateRadicalCard(ku);
        case 'kanji':
            return generateKanjiCard(ku, variant as 'meaning' | 'reading');
        case 'vocabulary':
            return generateVocabCard(ku, variant as 'meaning' | 'reading');
        case 'grammar':
            return await generateGrammarCard(ku, userId, recentGrammarSentences);
        default:
            console.warn(`${LOG_PREFIX} Unknown KU type:`, ku.type);
            return null;
    }
}

/**
 * Generate radical review card
 * ALWAYS meaning prompt - radicals are semantic mnemonics
 * 
 * Prompt: Show radical symbol → Ask for meaning
 */
function generateRadicalCard(ku: KnowledgeUnit): RadicalReviewCard {
    return {
        id: ku.id,
        ku_id: ku.id,
        ku_type: 'radical',
        prompt_variant: 'meaning',  // Always meaning
        level: ku.level,
        character: ku.character,
        meaning: ku.meaning,
        radical_name: ku.ku_radicals?.name,
        mnemonic: ku.mnemonics?.meaning,
        image_url: ku.mnemonics?.image_url
    };
}

/**
 * Generate kanji review card
 * EITHER meaning OR reading prompt (randomly selected)
 * 
 * Meaning: Show 食 → "What does this mean?"
 * Reading: Show 食 → "How do you read this?" (with optional context)
 */
function generateKanjiCard(
    ku: KnowledgeUnit,
    variant: 'meaning' | 'reading'
): KanjiReviewCard {
    const readingData = ku.ku_kanji?.reading_data || {};

    // For reading prompts, try to find a context word
    let contextWord: string | undefined;
    let contextReading: string | undefined;

    if (variant === 'reading') {
        // Try to use a common reading context if available
        // This would typically come from vocabulary examples
        // For now, we'll leave it optional
    }

    return {
        id: ku.id,
        ku_id: ku.id,
        ku_type: 'kanji',
        prompt_variant: variant,
        level: ku.level,
        character: ku.character,
        meaning: ku.meaning,
        readings: {
            onyomi: readingData.onyomi || [],
            kunyomi: readingData.kunyomi || [],
            primary: readingData.primary || readingData.onyomi?.[0]
        },
        context_word: contextWord,
        context_reading: contextReading,
        mnemonic_meaning: ku.mnemonics?.meaning,
        mnemonic_reading: ku.mnemonics?.reading
    };
}

/**
 * Generate vocabulary review card
 * EITHER meaning OR reading prompt (randomly selected)
 * 
 * Meaning: Show 環境 → "What does this mean?"
 * Reading: Show 環境 → "How do you read this?"
 */
function generateVocabCard(
    ku: KnowledgeUnit,
    variant: 'meaning' | 'reading'
): VocabReviewCard {
    return {
        id: ku.id,
        ku_id: ku.id,
        ku_type: 'vocabulary',
        prompt_variant: variant,
        level: ku.level,
        character: ku.character,
        meaning: ku.meaning,
        reading: ku.ku_vocabulary?.reading_primary || '',
        parts_of_speech: ku.ku_vocabulary?.parts_of_speech,
        audio_url: ku.ku_vocabulary?.audio,
        pitch: ku.ku_vocabulary?.pitch
    };
}

/**
 * Generate grammar review card with dynamic cloze
 * ALWAYS cloze prompt - grammar is never recalled in isolation
 * 
 * Prompt: Show sentence with blank → User fills in grammar point
 */
async function generateGrammarCard(
    ku: KnowledgeUnit,
    userId?: string,
    recentSentenceIds?: string[]
): Promise<GrammarReviewCard | null> {
    // Use the grammar cloze generator
    const clozeCard = await generateGrammarClozeCard(
        {
            id: ku.id,
            slug: ku.slug,
            character: ku.character || ku.meaning,
            meaning: ku.meaning,
            level: ku.level,
            ku_grammar: ku.ku_grammar
        },
        userId,
        recentSentenceIds || []
    );

    // Ensure prompt_variant is set
    if (clozeCard) {
        clozeCard.prompt_variant = 'cloze';
    }

    return clozeCard;
}

/**
 * Fetch KU with all related data for review card generation
 */
export async function fetchKUForReview(kuId: string): Promise<KnowledgeUnit | null> {
    console.log(`${LOG_PREFIX} Fetching KU for review:`, kuId);

    const { data, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            ku_radicals(*),
            ku_kanji(*),
            ku_vocabulary(*),
            ku_grammar(*)
        `)
        .eq('id', kuId)
        .single();

    if (error || !data) {
        console.error(`${LOG_PREFIX} Error fetching KU:`, error);
        return null;
    }

    return data as KnowledgeUnit;
}

/**
 * Generate review cards for a batch of KUs
 * 
 * This creates a mixed queue sorted by next_due (not by type),
 * as per the RPD specification.
 */
export async function generateReviewCards(
    kuIds: string[],
    userId?: string
): Promise<ReviewCard[]> {
    console.log(`${LOG_PREFIX} Generating ${kuIds.length} review cards`);

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
        .in('id', kuIds);

    if (error || !kus) {
        console.error(`${LOG_PREFIX} Error fetching KUs:`, error);
        return [];
    }

    // Track recent grammar sentences to avoid repetition
    const recentGrammarSentences: string[] = [];

    // Generate cards for each KU
    const cards: ReviewCard[] = [];
    for (const ku of kus) {
        const card = await generateReviewCard(
            ku as KnowledgeUnit,
            userId,
            recentGrammarSentences
        );

        if (card) {
            cards.push(card);

            // Track grammar sentence usage
            if (card.ku_type === 'grammar' && 'sentence_id' in card) {
                recentGrammarSentences.push(card.sentence_id);
                // Keep only last 5
                if (recentGrammarSentences.length > 5) {
                    recentGrammarSentences.shift();
                }
            }
        }
    }

    // Sort cards to match the original kuIds order (next_due ASC)
    const sortedCards = kuIds
        .map(id => cards.find(c => c.ku_id === id))
        .filter((c): c is ReviewCard => !!c);

    console.log(`${LOG_PREFIX} Generated ${sortedCards.length} cards (strictly ordered)`);
    return sortedCards;
}
