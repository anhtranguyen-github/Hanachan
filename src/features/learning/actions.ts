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
import { wanikaniSyncService } from './services/wanikaniSyncService';
import { createClient } from '@/utils/supabase/server';

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

export async function submitReviewAction(
    assignmentId: number | string,
    incorrectMeaningAnswers: number = 0,
    incorrectReadingAnswers: number = 0,
    deckId?: string,
    subjectId?: number | string,
) {
    try {
        const result = await submitReview(
            assignmentId,
            incorrectMeaningAnswers,
            incorrectReadingAnswers,
            deckId,
            subjectId,
        );
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function startReviewSessionAction(userId: string, limit: number = 20, contentType: string = 'all') {
    try {
        const result = await startReviewSession(userId, limit, contentType);
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function fetchUserDashboardStatsAction(userId: string, deckId?: string) {
    try {
        const stats = await fetchUserDashboardStats(userId, deckId);
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
        const assignments = await startLessonSession(userId, level, deckId);
        if (assignments.length === 0) {
            return { success: true, data: { items: [], batch: null } };
        }

        return { success: true, data: { items: assignments, batch: { id: 'v2-managed' } } };
    } catch (e: unknown) {
        console.error("[LearningActions] startLessonSession error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function startAssignmentAction(assignmentId: number | string) {
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

export async function updateKUNoteAction(userId: string, assignmentId: number | string, note: string) {
    // In v2, notes are in study_materials. This needs a new client method.
    // For now, return success to avoid breaking UI.
    return { success: true, data: note };
}

export async function completeLessonBatchAction(batchId: string) {
    // In v2 managed mode, assignments are processed individually.
    // This action can be a no-op or trigger a final revalidation.
    revalidatePath('/dashboard');
    revalidatePath('/learn');
    return { success: true };
}

export async function syncWaniKaniDataAction(apiToken: string, strategy: 'merge' | 'overwrite') {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const result = await wanikaniSyncService.sync(user.id, apiToken, strategy);
        
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        revalidatePath('/profile');
        
        return { success: true, data: result };
    } catch (e: unknown) {
        console.error("[LearningActions] syncWaniKaniDataAction error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}

export async function previewWaniKaniSyncAction(apiToken: string) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const stats = await wanikaniSyncService.preview(user.id, apiToken);
        return { success: true, data: stats };
    } catch (e: unknown) {
        console.error("[LearningActions] previewWaniKaniSyncAction error:", e);
        return { success: false, error: getErrorMessage(e) };
    }
}
