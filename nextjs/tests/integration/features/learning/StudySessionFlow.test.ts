import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview } from '@/features/learning/service';
import { srsRepository } from '@/features/learning/srsRepository';

vi.mock('@/features/learning/srsRepository');
vi.mock('@/features/analytics/service', () => ({
    analyticsService: {
        logReview: vi.fn().mockResolvedValue(undefined),
    }
}));
vi.mock('@/features/knowledge/db', () => ({
    curriculumRepository: {
        getById: vi.fn().mockResolvedValue(null),
    }
}));

describe('Study Session Integration Flow', () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const kuId = 'ku-test-1';
    const facet = 'meaning';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update user state correctly after a "pass" review', async () => {
        const currentState = {
            stage: 'learning' as any,
            stability: 0.166,
            difficulty: 3.0,
            reps: 1,
            lapses: 0
        };

        const updateSpy = vi.spyOn(srsRepository, 'updateUserState').mockResolvedValue(undefined as any);

        // Correct signature: (userId, unitId, facet, rating, currentState, wrongCount)
        const result = await submitReview(userId, kuId, facet, 'pass', currentState);

        // reps=1 -> reps=2 after pass
        expect(result.next_state.reps).toBe(2);
        // stability guard: reps=2 -> stability = 0.333 (8h)
        expect(result.next_state.stability).toBe(0.333);
        expect(result.next_review).toBeInstanceOf(Date);

        expect(updateSpy).toHaveBeenCalledWith(userId, kuId, facet, expect.objectContaining({
            reps: 2,
            stability: 0.333
        }), 'pass');
    });

    it('should handle failure on "again"', async () => {
        const currentState = {
            stage: 'review' as any,
            stability: 10,
            difficulty: 3.0,
            reps: 5,
            lapses: 0
        };

        const updateSpy = vi.spyOn(srsRepository, 'updateUserState').mockResolvedValue(undefined as any);

        // Correct signature: (userId, unitId, facet, rating, currentState, wrongCount)
        const result = await submitReview(userId, kuId, facet, 'again', currentState);

        // 'again' resets reps to 0 and increments lapses
        expect(result.next_state.reps).toBe(0);
        expect(result.next_state.stage).toBe('learning');
        expect(result.next_state.lapses).toBe(1);
        // Stability = 10 * 0.5 = 5
        expect(result.next_state.stability).toBe(5);

        expect(updateSpy).toHaveBeenCalledWith(userId, kuId, facet, expect.objectContaining({
            state: 'learning',
            reps: 0,
            lapses: 1
        }), 'again');
    });
});
