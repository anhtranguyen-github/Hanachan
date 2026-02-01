'use server';

import {
    submitReview,
    fetchDueItems,
    fetchNewItems,
    fetchLevelStats,
    fetchUserDashboardStats,
    initializeSRS
} from './service';
import { revalidatePath } from 'next/cache';

export async function initializeSRSAction(userId: string, unitId: string, facets: string[]) {
    try {
        await initializeSRS(userId, unitId, facets);
        revalidatePath('/dashboard');
        revalidatePath('/learn');
        revalidatePath('/levels');
        return { success: true };
    } catch (e: any) {
        console.error("[LearningActions] Failed to initialize SRS", e);
        return { success: false, error: e.message };
    }
}

export async function submitReviewAction(userId: string, unitId: string, facet: string, rating: any, currentState: any) {
    try {
        const result = await submitReview(userId, unitId, facet, rating, currentState);
        revalidatePath('/dashboard');
        revalidatePath('/review');
        revalidatePath('/levels');
        revalidatePath('/levels/[id]', 'page');
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function fetchUserDashboardStatsAction(userId: string) {
    console.log('[LearningActions] fetchUserDashboardStatsAction called for userId:', userId);
    try {
        const stats = await fetchUserDashboardStats(userId);
        console.log('[LearningActions] Stats received:', !!stats);
        return { success: true, data: stats };
    } catch (e: any) {
        console.error('[LearningActions] Error:', e.message);
        return { success: false, error: e.message };
    }
}
export async function fetchDueItemsAction(userId: string) {
    try {
        const items = await fetchDueItems(userId);
        return { success: true, data: items };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
