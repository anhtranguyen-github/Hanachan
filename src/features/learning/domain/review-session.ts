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
import { learningRepository } from '../db';

const LOG_PREFIX = '[ReviewSession]';

interface DueItem {
    ku_id: string;
    facet: string;
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
        levelId?: string;
        level?: number;
    }
): Promise<DueItem[]> {
    console.log(`${LOG_PREFIX} Getting due items for user:`, userId, options);

    let query = supabase
        .from('user_learning_states')
        .select(`
            ku_id,
            facet,
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

    // Filter by level (direct or via virtual levelId)
    let level = options?.level;
    if (options?.levelId?.startsWith('virtual-level-')) {
        level = parseInt(options.levelId.replace('virtual-level-', ''));
    }

    if (level) {
        query = query.eq('knowledge_units.level', level);
    }

    // Filter by Level ID (virtual levels: level-1, level-2, etc.)
    if (options?.levelId) {
        const match = options.levelId.match(/^(?:virtual-)?level-(\d+)$/);
        if (match) {
            const levelNum = parseInt(match[1]);
            query = query.eq('knowledge_units.level', levelNum);
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
        levelId?: string;
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

    // Filter by level (direct or via virtual levelId)
    let level = options?.level;
    if (options?.levelId?.startsWith('virtual-level-')) {
        level = parseInt(options.levelId.replace('virtual-level-', ''));
    }

    if (level) {
        query = query.eq('level', level);
    }

    // Filter by Level ID (virtual levels: level-1, level-2, etc.)
    if (options?.levelId) {
        const match = options.levelId.match(/^(?:virtual-)?level-(\d+)$/);
        if (match) {
            const levelNum = parseInt(match[1]);
            query = query.eq('level', levelNum);
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
        levelId?: string;
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
            levelId: options?.levelId
        });

        // For LEARN, we usually initialize all facets. 
        // For simplicity, let's start with 'meaning' (or 'cloze' for grammar)
        const itemsToGenerate = newItems.flatMap(n => {
            if (n.type === 'kanji' || n.type === 'vocabulary') {
                return [
                    { kuId: n.id, facet: 'meaning' },
                    { kuId: n.id, facet: 'reading' }
                ];
            }
            return [{ kuId: n.id, facet: n.type === 'grammar' ? 'cloze' : 'meaning' }];
        });

        cards = await generateReviewCards(itemsToGenerate, userId);
    } else {
        // REVIEW: Fetch strictly DUE items
        const dueItems = await getDueReviewItems(userId, {
            limit: maxCards,
            kuType: options?.kuType,
            level: options?.level,
            levelId: options?.levelId
        });
        cards = await generateReviewCards(dueItems.map(d => ({ kuId: d.ku_id, facet: d.facet })), userId);
    }

    // Create session
    const session: ReviewSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        level_id: options?.levelId,
        session_type: sessionType,
        cards: cards,
        current_index: 0,
        started_at: new Date().toISOString()
    };

    // Persistence Hook (Relational Session Tracking)
    try {
        const dbSession = await learningRepository.createReviewSession(userId, cards.length);
        // Overwrite random ID with DB ID for persistence
        session.id = dbSession.id;

        const sessionItems = cards.map(c => ({
            ku_id: c.ku_id,
            facet: c.prompt_variant
        }));
        await learningRepository.createReviewSessionItems(session.id, sessionItems);
    } catch (e) {
        console.error(`${LOG_PREFIX} Failed to persist session header`, e);
    }

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

    // Use stored correct_answers if available (from Questions table)
    if (card.correct_answers && card.correct_answers.length > 0) {
        const isCorrect = card.correct_answers.some(ans => {
            const normAns = ans.trim().toLowerCase();
            return normalized === normAns;
        });
        return { correct: isCorrect, similarity: isCorrect ? 1 : 0 };
    }

    // Fallback to legacy logic if correct_answers is missing (should not happen with seeding)
    // Grammar cloze uses its own validation logic
    if (card.ku_type === 'grammar') {
        return validateClozeAnswer(userInput, card.cloze_answer);
    }
    // Kanji / Vocab Reading fallback
    if (card.ku_type === 'kanji' || card.ku_type === 'vocabulary') {
        if (card.prompt_variant === 'reading') {
            const expected = card.ku_type === 'kanji'
                ? [...((card as KanjiReviewCard).readings.onyomi || []), ...((card as KanjiReviewCard).readings.kunyomi || [])]
                : [(card as VocabReviewCard).reading];

            const isCorrect = expected.some(s => normalized === s.trim().toLowerCase());
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
    rating: 'again' | 'good';
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
        .eq('facet', card.prompt_variant)
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
            facet: card.prompt_variant,
            state: next_state.stage,
            stability: next_state.ease_factor,
            difficulty: 0,
            last_review: new Date().toISOString(),
            next_review: next_review.toISOString(),
            reps: next_state.streak,
            lapses: rating === 'again' ? (currentState?.lapses || 0) + 1 : (currentState?.lapses || 0)
        }, {
            onConflict: 'user_id,ku_id,facet'
        });

    if (error) {
        console.error(`${LOG_PREFIX} Error updating learning state:`, error);
    }

    return {
        correct: isCorrect,
        rating: rating as 'again' | 'good',
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
