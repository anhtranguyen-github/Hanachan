import { RatingSchema, SRSStateSchema } from '@/lib/validation';
import { z } from 'zod';
import { calculateNextReview, Rating, SRSState } from './algorithm';
import { MockDB } from '@/lib/mock-db';

export async function submitReview(userId: string, kuId: string, rating: Rating, currentState: SRSState) {
    // 0. Validation
    RatingSchema.parse(rating);
    SRSStateSchema.parse(currentState);

    // 1. Calculate New State
    const { next_review, next_state } = calculateNextReview(currentState, rating);

    console.log(`[MockDB] Submitting review for ${kuId}:`, rating);
    await MockDB.updateUserState(userId, kuId, {
        state: next_state.stage,
        next_review: next_review.toISOString(),
        srs_stage: next_state.streak,
        last_review: new Date().toISOString(),
        stability: next_state.ease_factor
    });
    return { next_review, next_state };
}

export async function fetchDueItems(userId: string, deckId?: string) {
    return MockDB.fetchDueItems(userId);
}

export async function fetchNewItems(userId: string, deckId?: string, limit = 5) {
    let level: number | undefined;
    if (deckId?.startsWith('level-')) {
        level = parseInt(deckId.split('-')[1]);
    }
    return MockDB.fetchNewItems(userId, limit, level);
}

export async function fetchDeckStats(userId: string, deckId: string) {
    let level: number | null = null;
    if (deckId.startsWith('level-')) {
        level = parseInt(deckId.split('-')[1]);
    }

    if (!level) return { total: 0, learned: 0, due: 0, new: 0 };

    const mockStats = await MockDB.fetchCurriculumStats();
    const mockCount = (mockStats as any)[level] || 100;

    return {
        total: mockCount,
        learned: Math.floor(mockCount * 0.1),
        due: 5,
        new: Math.floor(mockCount * 0.9)
    };
}

export async function fetchLevelContent(level: number, userId: string) {
    return MockDB.fetchLevelContent(level, userId);
}

export async function fetchCurriculumStats() {
    return MockDB.fetchCurriculumStats();
}

export async function fetchUserDashboardStats(userId: string) {
    return MockDB.fetchUserDashboardStats(userId);
}

export async function fetchItemDetails(type: string, slug: string) {
    return MockDB.fetchItemDetails(type, slug);
}


