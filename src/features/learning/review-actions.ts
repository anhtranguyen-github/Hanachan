'use server';

/**
 * Review Server Actions
 * 
 * Server-side actions for the review system.
 */

import {
    startReviewSession,
    submitReviewAnswer,
    getReviewStats,
    getDueReviewItems,
    getNewItems
} from './domain/review-session';
import { generateReviewCards } from './domain/review-card-generator';
import { ReviewCard, ReviewSession, ReviewAnswer } from './types/review-cards';
import { revalidatePath } from 'next/cache';

const LOG_PREFIX = '[ReviewActions]';

export interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Start a review session
 */
export async function startReviewSessionAction(
    userId: string,
    options?: {
        type?: 'learn' | 'review';
        levelId?: string;
        unitType?: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
        level?: number;
        maxCards?: number;
    }
): Promise<ActionResult<ReviewSession>> {
    console.log(`${LOG_PREFIX} startReviewSessionAction:`, { userId, options });

    try {
        const session = await startReviewSession(userId, options);
        return { success: true, data: session };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error starting session:`, e);
        return { success: false, error: e.message };
    }
}

/**
 * Get next review card (for incremental loading)
 */
export async function getNextReviewCardAction(
    userId: string,
    unitIds: string[]
): Promise<ActionResult<ReviewCard[]>> {
    console.log(`${LOG_PREFIX} getNextReviewCardAction:`, { userId, count: unitIds.length });

    try {
        const cards = await generateReviewCards(unitIds.map(id => ({ unitId: id, facet: 'meaning' })), userId);
        return { success: true, data: cards };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error getting cards:`, e);
        return { success: false, error: e.message };
    }
}

/**
 * Submit an answer for a review card
 */
export async function submitReviewAnswerAction(
    userId: string,
    card: ReviewCard,
    answer: ReviewAnswer
): Promise<ActionResult<{ correct: boolean; rating: 'again' | 'good'; nextReview: string }>> {
    console.log(`${LOG_PREFIX} submitReviewAnswerAction:`, { userId, unitId: card.ku_id, rating: answer.rating });

    try {
        const result = await submitReviewAnswer(userId, card, answer);

        // Revalidate relevant paths for global stats
        revalidatePath('/dashboard');
        revalidatePath('/review');
        revalidatePath('/levels');
        // Also revalidate the generic level detail path pattern
        revalidatePath('/levels/[id]', 'page');

        return {
            success: true,
            data: {
                correct: result.correct,
                rating: result.rating,
                nextReview: result.nextReview.toISOString()
            }
        };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error submitting answer:`, e);
        return { success: false, error: e.message };
    }
}

/**
 * Get review statistics
 */
export async function getReviewStatsAction(
    userId: string
): Promise<ActionResult<{
    due: number;
    dueByType: Record<string, number>;
    learned: number;
    burned: number;
}>> {
    console.log(`${LOG_PREFIX} getReviewStatsAction:`, userId);

    try {
        const stats = await getReviewStats(userId);
        return { success: true, data: stats };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error getting stats:`, e);
        return {
            success: false,
            error: e.message,
            data: { due: 0, dueByType: {}, learned: 0, burned: 0 }
        };
    }
}

/**
 * Get due items count by type
 */
export async function getDueCountsAction(
    userId: string
): Promise<ActionResult<{
    radical: number;
    kanji: number;
    vocabulary: number;
    grammar: number;
    total: number;
}>> {
    console.log(`${LOG_PREFIX} getDueCountsAction:`, userId);

    try {
        const stats = await getReviewStats(userId);
        return {
            success: true,
            data: {
                ...stats.dueByType,
                total: stats.due
            } as any
        };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error getting due counts:`, e);
        return {
            success: false,
            error: e.message,
            data: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0, total: 0 }
        };
    }
}

/**
 * Get a single grammar cloze card (for testing/preview)
 */
export async function getGrammarClozeCardAction(
    userId: string,
    grammarId: string
): Promise<ActionResult<ReviewCard>> {
    console.log(`${LOG_PREFIX} getGrammarClozeCardAction:`, { userId, grammarId });

    try {
        const cards = await generateReviewCards([{ unitId: grammarId, facet: 'cloze' }], userId);

        if (cards.length === 0) {
            return { success: false, error: 'No card generated' };
        }

        return { success: true, data: cards[0] };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error getting grammar card:`, e);
        return { success: false, error: e.message };
    }
}
