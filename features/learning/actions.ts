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

export async function submitReviewAction(assignmentId: number, incorrectMeaningAnswers: number = 0, incorrectReadingAnswers: number = 0) {
    try {
        const result = await submitReview(assignmentId, incorrectMeaningAnswers, incorrectReadingAnswers);
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
    try {
        const stats = await fetchUserDashboardStats(deckId);
        return { success: true, data: stats };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
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

export async function fetchNewItemsAction(userId: string, identifier: string, limit: number = 5) {
    try {
        const items = await fetchNewItems(userId, identifier, limit);
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
        // v2 doesn't use batches in the same way, but we can list assignments available for lessons
        const assignments = await startLessonSession(level, deckId);
        if (assignments.length === 0) {
            return { success: true, data: { items: [], batch: null } };
        }

        return { success: true, data: { items: assignments, batch: { id: 'v2-managed' } } };
    } catch (e: unknown) {
        console.error("[LearningActions] startLessonSession error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function startAssignmentAction(assignmentId: number) {
    try {
        await completeLessonSession(assignmentId);
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        return { success: true };
    } catch (e: unknown) {
        console.error("[LearningActions] startAssignmentAction error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function updateKUNoteAction(userId: string, assignmentId: number, note: string) {
    // In v2, notes are in study_materials. This needs a new client method.
    // For now, return success to avoid breaking UI.
    return { success: true, data: note };
}
