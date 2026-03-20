'use server';

import { revalidatePath } from 'next/cache';

import {
    completeLessonSession,
    fetchUserDashboardStats,
    startLessonSession,
    startReviewSession,
    submitReview,
} from './service';
import {
    fetchCurriculumStats,
    fetchDueItems,
    fetchLevelStats,
    fetchNewItems,
    initializeSRS,
} from './data';
import { lessonRepository } from './lessonRepository';
import { srsRepository } from './srsRepository';

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return 'Unknown error';
    }
}

export async function initializeSRSAction(userId: string, unitId: string, facets: string[]) {
    try {
        await initializeSRS(userId, unitId, facets);
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        revalidatePath('/levels');
        return { success: true };
    } catch (e: unknown) {
        console.error("[LearningActions] Failed to initialize SRS", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function submitReviewAction(sessionId: string, unitId: string, facet: string, rating: any, attemptCount: number, wrongCount: number) {
    try {
        const result = await submitReview(sessionId, unitId, facet, rating, attemptCount, wrongCount);
        // Do not revalidate everything yet to keep UI fast
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function startReviewSessionAction(limit: number = 20, contentType: string = 'all') {
    try {
        const result = await startReviewSession(limit, contentType);
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function fetchUserDashboardStatsAction(userId: string, deckId?: string) {
    console.log('[LearningActions] fetchUserDashboardStatsAction called for userId:', userId, 'deckId:', deckId);
    try {
        const stats = await fetchUserDashboardStats(deckId);
        console.log('[LearningActions] Stats received:', !!stats);
        return { success: true, data: stats };
    } catch (e: unknown) {
        const message = getErrorMessage(e);
        console.error('[LearningActions] Error:', message);
        return { success: false, error: message };
    }
}

export async function fetchDueItemsAction(userId: string, deckId?: string) {
    try {
        const items = await fetchDueItems(userId, deckId);
        return { success: true, data: items };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function fetchNewItemsAction(userId: string, levelId: string, limit: number = 5) {
    try {
        const items = await fetchNewItems(userId, levelId, limit);
        return { success: true, data: items };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function fetchLevelStatsAction(userId: string, levelId: string) {
    try {
        const stats = await fetchLevelStats(userId, levelId);
        return { success: true, data: stats };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function fetchCurriculumStatsAction() {
    try {
        const stats = await fetchCurriculumStats();
        return { success: true, data: stats };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function startLessonSessionAction(userId: string, level?: number, deckId?: string) {
    try {
        const DAILY_LIMIT = 50;
        const todayCount = await lessonRepository.countTodayBatches(userId);

        if (todayCount >= DAILY_LIMIT) {
            throw new Error(`Daily limit reached! You have already finished ${DAILY_LIMIT} batches today. Take a rest for better retention.`);
        }

        const items = await lessonRepository.fetchNewItems(userId, 5, level, deckId);
        if (items.length === 0) {
            return { success: true, data: { items: [], batch: null } };
        }

        const response = await startLessonSession(items.map((item: any) => item.ku_id), level, deckId) as any;
        return { success: true, data: { items, batch: { id: response.batch_id } } };
    } catch (e: unknown) {
        console.error("[LearningActions] startLessonSession error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function completeLessonBatchAction(batchId: string) {
    try {
        await completeLessonSession(batchId);
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        return { success: true };
    } catch (e: unknown) {
        console.error("[LearningActions] completeLessonBatch error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function updateKUNoteAction(userId: string, kuId: string, note: string) {
    try {
        const updatedNotes = await srsRepository.updateKUNote(userId, kuId, note);
        return { success: true, data: updatedNotes };
    } catch (e: unknown) {
        console.error("[LearningActions] updateKUNote error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}
