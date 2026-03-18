'use server';

import {
    submitReview,
    fetchDueItems,
    fetchUserDashboardStats,
    initializeSRS,
    startLessonSession
} from './service';
import { lessonRepository } from './lessonRepository';
import { srsRepository } from './srsRepository';
import { revalidatePath } from 'next/cache';

export async function initializeSRSAction(userId: string, unitId: string, facets: string[]) {
    try {
        await initializeSRS(userId, unitId, facets);
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        revalidatePath('/levels');
        return { success: true };
    } catch (e: unknown) {
        console.error("[LearningActions] Failed to initialize SRS", e);
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function submitReviewAction(sessionId: string, unitId: string, facet: string, rating: any, attemptCount: number, wrongCount: number) {
    try {
        const result = await coreClient.submitReview({
            sessionId,
            kuId: unitId,
            facet,
            rating,
            attemptCount,
            wrongCount
        });
        // Do not revalidate everything yet to keep UI fast
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function startReviewSessionAction(limit: number = 20, contentType: string = 'all') {
    try {
        const result = await coreClient.startReviewSession(limit, contentType);
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchUserDashboardStatsAction(userId: string, deckId?: string) {
    console.log('[LearningActions] fetchUserDashboardStatsAction called for userId:', userId, 'deckId:', deckId);
    try {
        const stats = await fetchUserDashboardStats(userId, deckId);
        console.log('[LearningActions] Stats received:', !!stats);
        return { success: true, data: stats };
    } catch (e: unknown) {
        console.error('[LearningActions] Error:', (e instanceof Error ? e.message : String(e)));
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchDueItemsAction(userId: string, deckId?: string) {
    try {
        const items = await fetchDueItems(userId, deckId);
        return { success: true, data: items };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

import { fetchLevelStats, fetchCurriculumStats, fetchNewItems } from './service';

export async function fetchNewItemsAction(userId: string, levelId: string, limit: number = 5) {
    try {
        const items = await fetchNewItems(userId, levelId, limit);
        return { success: true, data: items };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchLevelStatsAction(userId: string, levelId: string) {
    try {
        const stats = await fetchLevelStats(userId, levelId);
        return { success: true, data: stats };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchCurriculumStatsAction() {
    try {
        const stats = await fetchCurriculumStats();
        return { success: true, data: stats };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function startLessonSessionAction(userId: string, level?: number, deckId?: string) {
    try {
        const result = await startLessonSession(userId, level, deckId);
        return { success: true, data: result };
    } catch (e: unknown) {
        console.error("[LearningActions] startLessonSession error:", e);
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

import { coreClient } from '@/services/coreClient';

export async function completeLessonBatchAction(batchId: string) {
    try {
        await coreClient.completeLessonSession(batchId);
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        return { success: true };
    } catch (e: unknown) {
        console.error("[LearningActions] completeLessonBatch error:", e);
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function updateKUNoteAction(userId: string, kuId: string, note: string) {
    try {
        const updatedNotes = await srsRepository.updateKUNote(userId, kuId, note);
        return { success: true, data: updatedNotes };
    } catch (e: unknown) {
        console.error("[LearningActions] updateKUNote error:", e);
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}
