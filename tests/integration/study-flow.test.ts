
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { learningService } from '../../src/features/learning/service';
import * as db from '../../src/features/learning/db';
import { analyticsService } from '../../src/features/analytics/service';

// Mock DB
vi.mock('../../src/features/learning/db', () => ({
    getDueCards: vi.fn(),
    getUserLearningStates: vi.fn(),
    getLearningSettings: vi.fn(),
    updateLearningState: vi.fn(),
    logReviewHistory: vi.fn(),
}));

vi.mock('../../src/features/analytics/service', () => ({
    analyticsService: {
        trackReview: vi.fn(),
    }
}));

describe('Integrated Study Flow Logic', () => {
    const userId = 'user_123';
    const kuId = 'n5-vocab-taberu';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully orchestrate a card review from New to Review', async () => {
        // Setup mocks
        (db.getLearningSettings as any).mockResolvedValue({
            weights: [0.4, 0.6, 2.4, 5.8, 4.9, 0.4, 0.9, 0, 1.5, 0.4, 0.7, 0.8, 0.1, 0.3, 1.5, 0.4, 2.4],
            targetRetention: 0.9
        });

        (db.getUserLearningStates as any).mockResolvedValue({
            [kuId]: {
                state: 'New',
                reps: 0,
                lapses: 0,
                stability: 0,
                difficulty: 0
            }
        });

        // Execute: User rates "Good" (3)
        const result = await learningService.submitReview(userId, kuId, 3);

        // Verify Algorithm Result
        expect(result.next_state).toBe('Review');
        expect(result.scheduled_days).toBeGreaterThan(0);

        // Verify Persistence Calls
        expect(db.updateLearningState).toHaveBeenCalledWith(
            userId,
            kuId,
            expect.objectContaining({ next_state: 'Review' }),
            1, // reps
            0  // lapses
        );

        expect(db.logReviewHistory).toHaveBeenCalled();
        expect(analyticsService.trackReview).toHaveBeenCalledWith(userId, true);
    });

    it('should handle "Again" (1) rating correctly by incrementing lapses', async () => {
        (db.getLearningSettings as any).mockResolvedValue({ weights: undefined, targetRetention: 0.9 });
        (db.getUserLearningStates as any).mockResolvedValue({
            [kuId]: {
                state: 'Review',
                reps: 1,
                lapses: 0,
                stability: 5,
                difficulty: 3,
                last_review: new Date().toISOString()
            }
        });

        const result = await learningService.submitReview(userId, kuId, 1);

        expect(result.next_state).toBe('Relearning');
        expect(db.updateLearningState).toHaveBeenCalledWith(
            userId,
            kuId,
            expect.any(Object),
            2, // reps
            1  // lapses incremented
        );
    });
});
