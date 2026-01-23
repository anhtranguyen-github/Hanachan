/**
 * Review Session Service
 * 
 * Orchestrates review sessions with unified learning state
 * but different presentation methods per KU type.
 */

import { supabase } from '@/lib/supabase';
import { ReviewCard, ReviewAnswer, ReviewSession } from '../types/review-cards';
import { generateReviewCards } from './review-card-generator';
import { calculateNextReview, Rating, SRSState } from './SRSAlgorithm';
import { validateClozeAnswer } from './grammar-cloze';

const LOG_PREFIX = '[ReviewSession]';

interface DueItem {
    ku_id: string;
    ku_type: string;
    next_review: string;
    state: string;
    knowledge_units: {
        id: string;
        type: string;
        level: number;
        character?: string;
        meaning: string;
    };
}

/**
 * Get items due for review
 */
export async function getDueReviewItems(
    userId: string,
    options?: {
        limit?: number;
        kuType?: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
        deckId?: string;
        level?: number;
    }
): Promise<DueItem[]> {
    console.log(`${LOG_PREFIX} Getting due items for user:`, userId, options);

    let query = supabase
        .from('user_learning_states')
        .select(`
            ku_id,
            state,
            next_review,
            knowledge_units!inner(id, type, level, character, meaning)
        `)
        .eq('user_id', userId)
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true });

    // Filter by KU type if specified
    if (options?.kuType) {
        query = query.eq('knowledge_units.type', options.kuType);
    }

    // Filter by level (direct or via virtual deckId)
    let level = options?.level;
    if (options?.deckId?.startsWith('virtual-level-')) {
        level = parseInt(options.deckId.replace('virtual-level-', ''));
    }

    if (level) {
        query = query.eq('knowledge_units.level', level);
    }

    // Filter by real Deck ID
    if (options?.deckId && !options.deckId.startsWith('virtual-level-')) {
        // 1. Check if it's a system deck with a level
        const { data: deck } = await supabase
            .from('decks')
            .select('deck_type, level')
            .eq('id', options.deckId)
            .maybeSingle();

        if (deck?.deck_type === 'system' && deck.level) {
            query = query.eq('knowledge_units.level', deck.level);
        } else {
            // 2. Fetch from deck_items
            const { data: deckItems } = await supabase
                .from('deck_items')
                .select('ku_id')
                .eq('deck_id', options.deckId);

            const kuIdsInDeck = (deckItems || []).map(i => i.ku_id).filter(Boolean) as string[];
            if (kuIdsInDeck.length > 0) {
                query = query.in('ku_id', kuIdsInDeck);
            } else {
                console.log(`${LOG_PREFIX} No items found in deck (user deck with no items)`);
                return [];
            }
        }
    }

    // Apply limit
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching due items:`, error);
        return [];
    }

    console.log(`${LOG_PREFIX} Found ${data?.length || 0} due items`);
    return (data || []) as any as DueItem[];
}

/**
 * Get new items for learning
 */
export async function getNewItems(
    userId: string,
    options?: {
        limit?: number;
        kuType?: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
        deckId?: string;
        level?: number;
    }
): Promise<any[]> {
    console.log(`${LOG_PREFIX} Getting new items for user:`, userId, options);

    // Get KUs that user has already started learning
    const { data: learnedIds } = await supabase
        .from('user_learning_states')
        .select('ku_id')
        .eq('user_id', userId);

    const excludeIds = (learnedIds || []).map(l => l.ku_id);

    let query = supabase
        .from('knowledge_units')
        .select('*')
        .order('level', { ascending: true });

    // Exclude already-learned items using the correct filter format
    if (excludeIds.length > 0) {
        // Use proper Supabase filter format for NOT IN
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    if (options?.kuType) {
        query = query.eq('type', options.kuType);
    }

    // Filter by level (direct or via virtual deckId)
    let level = options?.level;
    if (options?.deckId?.startsWith('virtual-level-')) {
        level = parseInt(options.deckId.replace('virtual-level-', ''));
    }

    if (level) {
        query = query.eq('level', level);
    }

    // Filter by real Deck ID
    if (options?.deckId && !options.deckId.startsWith('virtual-level-')) {
        // 1. Check if it's a system deck with a level
        const { data: deck } = await supabase
            .from('decks')
            .select('deck_type, level')
            .eq('id', options.deckId)
            .maybeSingle();

        if (deck?.deck_type === 'system' && deck.level) {
            // System deck: Query by level directly (no need to check deck_items)
            query = query.eq('level', deck.level);
        } else {
            // 2. User deck: Fetch from deck_items
            const { data: deckItems } = await supabase
                .from('deck_items')
                .select('ku_id')
                .eq('deck_id', options.deckId);

            const kuIdsInDeck = (deckItems || []).map(i => i.ku_id).filter(Boolean) as string[];
            if (kuIdsInDeck.length > 0) {
                query = query.in('id', kuIdsInDeck);
            } else {
                console.log(`${LOG_PREFIX} No items found in deck (user deck with no items)`);
                return [];
            }
        }
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching new items:`, error);
        return [];
    }

    console.log(`${LOG_PREFIX} Found ${data?.length || 0} new items`);
    return data || [];
}

/**
 * Start a review session
 */
/**
 * Start a review session
 */
export async function startReviewSession(
    userId: string,
    options?: {
        type?: 'learn' | 'review'; // Explicit session type
        deckId?: string;
        kuType?: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
        level?: number;
        maxCards?: number;
    }
): Promise<ReviewSession> {
    const sessionType = options?.type || 'review';
    console.log(`${LOG_PREFIX} Starting ${sessionType} session for user:`, userId);

    const maxCards = options?.maxCards || 20;
    let cards: ReviewCard[] = [];

    if (sessionType === 'learn') {
        // LEARN: Fetch strictly NEW items (FSRS state == NULL)
        const newItems = await getNewItems(userId, {
            limit: maxCards,
            kuType: options?.kuType,
            level: options?.level,
            deckId: options?.deckId
        });
        cards = await generateReviewCards(newItems.map(n => n.id), userId);
    } else {
        // REVIEW: Fetch strictly DUE items
        const dueItems = await getDueReviewItems(userId, {
            limit: maxCards,
            kuType: options?.kuType,
            level: options?.level,
            deckId: options?.deckId
        });
        cards = await generateReviewCards(dueItems.map(d => d.ku_id), userId);
    }

    // Create session
    const session: ReviewSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        deck_id: options?.deckId,
        session_type: sessionType,
        cards: cards,
        current_index: 0,
        started_at: new Date().toISOString()
    };

    console.log(`${LOG_PREFIX} ${sessionType} session created with ${cards.length} cards`);
    return session;
}

/**
 * Submit an answer for a review card
 */
/**
 * Validate user answer against card data
 */
function validateAnswer(card: ReviewCard, userInput: string): { correct: boolean; similarity: number } {
    const normalized = userInput.trim().toLowerCase();

    // Grammar cloze uses its own validation logic
    if (card.ku_type === 'grammar') {
        return validateClozeAnswer(userInput, card.cloze_answer);
    }

    // Radical: Meaning only
    if (card.ku_type === 'radical') {
        const expected = card.meaning.toLowerCase();
        const synonyms = expected.split(',').map(s => s.trim());
        const isCorrect = synonyms.some(s => normalized === s || normalized.includes(s));
        return { correct: isCorrect, similarity: isCorrect ? 1 : 0 };
    }

    // Kanji / Vocab
    if (card.ku_type === 'kanji' || card.ku_type === 'vocabulary') {
        if (card.prompt_variant === 'meaning') {
            const expected = card.meaning.toLowerCase();
            const synonyms = expected.split(',').map(s => s.trim());
            const isCorrect = synonyms.some(s => normalized === s);
            return { correct: isCorrect, similarity: isCorrect ? 1 : 0 };
        } else {
            // Reading validation
            const expected = card.ku_type === 'kanji'
                ? [...(card.readings.onyomi || []), ...(card.readings.kunyomi || [])]
                : [card.reading];

            const isCorrect = expected.map(r => r.toLowerCase()).includes(normalized);
            return { correct: isCorrect, similarity: isCorrect ? 1 : 0 };
        }
    }

    return { correct: false, similarity: 0 };
}

/**
 * Submit an answer for a review card
 */
export async function submitReviewAnswer(
    userId: string,
    card: ReviewCard,
    answer: ReviewAnswer
): Promise<{
    correct: boolean;
    rating: 'again' | 'hard' | 'good' | 'easy';
    nextReview: Date | null;
}> {
    console.log(`${LOG_PREFIX} Submitting answer for ${card.ku_type} (${card.prompt_variant}):`, card.ku_id);

    const validation = validateAnswer(card, answer.user_input);
    const isCorrect = validation.correct;

    // Map validation to FSRS rating if not provided
    // If wrong, rating is ALWAYS 'again'
    // If correct, default to 'good' unless it was very fast (easy) or slow (hard)
    let rating = isCorrect ? (answer.rating || 'good') : 'again';

    // Get current learning state
    const { data: currentState } = await supabase
        .from('user_learning_states')
        .select('*')
        .eq('user_id', userId)
        .eq('ku_id', card.ku_id)
        .maybeSingle();

    const isLearnMode = !currentState;

    // RULE: Learn errors do NOT affecting FSRS
    if (isLearnMode && !isCorrect) {
        return {
            correct: false,
            rating: 'again',
            nextReview: null // No state change in DB
        };
    }

    // Calculate new state using SRS
    const srsState: SRSState = currentState ? {
        stage: currentState.state,
        interval: currentState.stability || 0,
        ease_factor: currentState.stability || 2.5,
        streak: currentState.reps || 0
    } : {
        stage: 'new',
        interval: 0,
        ease_factor: 2.5,
        streak: 0
    };

    const { next_review, next_state } = calculateNextReview(srsState, rating as Rating);

    // Update learning state only if correct (in Learn) or any attempt (in Review)
    // Rule: We create the first state ONLY when corrected the first time.
    const { error } = await supabase
        .from('user_learning_states')
        .upsert({
            user_id: userId,
            ku_id: card.ku_id,
            state: next_state.stage,
            stability: next_state.ease_factor,
            difficulty: 0,
            last_review: new Date().toISOString(),
            next_review: next_review.toISOString(),
            reps: next_state.streak,
            lapses: rating === 'again' ? (currentState?.lapses || 0) + 1 : (currentState?.lapses || 0)
        }, {
            onConflict: 'user_id,ku_id'
        });

    if (error) {
        console.error(`${LOG_PREFIX} Error updating learning state:`, error);
    }

    return {
        correct: isCorrect,
        rating: rating as 'again' | 'hard' | 'good' | 'easy',
        nextReview: next_review
    };
}

/**
 * Get review statistics for a user
 */
export async function getReviewStats(userId: string): Promise<{
    due: number;
    dueByType: Record<string, number>;
    learned: number;
    burned: number;
    newItems: number; // NEW
}> {
    console.log(`${LOG_PREFIX} Getting review stats for user:`, userId);

    const now = new Date().toISOString();

    // Get due count
    const { count: dueCount } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review', now);

    // Get learned count
    const { count: learnedCount } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Get total KUs to calculate New
    const { count: totalKUCount } = await supabase
        .from('knowledge_units')
        .select('*', { count: 'exact', head: true });

    // Get burned count
    const { count: burnedCount } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('state', 'burned');

    // Due by type calculation...
    const { data: dueByTypeData } = await supabase
        .from('user_learning_states')
        .select('knowledge_units!inner(type)')
        .eq('user_id', userId)
        .lte('next_review', now);

    const dueByType: Record<string, number> = {
        radical: 0,
        kanji: 0,
        vocabulary: 0,
        grammar: 0
    };

    (dueByTypeData || []).forEach((d: any) => {
        const type = d.knowledge_units?.type;
        if (type && dueByType.hasOwnProperty(type)) {
            dueByType[type]++;
        }
    });

    return {
        due: dueCount || 0,
        dueByType,
        learned: learnedCount || 0,
        burned: burnedCount || 0,
        newItems: (totalKUCount || 0) - (learnedCount || 0)
    };
}
