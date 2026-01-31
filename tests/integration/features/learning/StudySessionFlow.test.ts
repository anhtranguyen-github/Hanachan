
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview } from '@/features/learning/service';
import { learningRepository } from '@/features/learning/db';

vi.mock('@/features/learning/db');

describe('Study Session Integration Flow', () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const kuId = 'ku-test-1';
    const facet = 'meaning';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update user state correctly after a "good" review', async () => {
        const currentState = {
            stage: 'learning' as any,
            stability: 0.166,
            difficulty: 3.0,
            reps: 1,
            lapses: 0
        };

        const updateSpy = vi.spyOn(learningRepository, 'updateUserState').mockResolvedValue(undefined as any);

        const result = await submitReview(userId, kuId, facet, 'good', currentState);

        // Verify result from algorithm logic through the service
        expect(result.next_state.reps).toBe(2);
        expect(result.next_state.stage).toBe('learning');
        expect(result.next_review).toBeInstanceOf(Date);

        // Verify repository interaction
        expect(updateSpy).toHaveBeenCalledWith(userId, kuId, facet, expect.objectContaining({
            state: 'learning',
            reps: 2,
            stability: 0.333
        }), 'good');
    });

    it('should handle failure on "again"', async () => {
        const currentState = {
            stage: 'review' as any,
            stability: 10,
            difficulty: 3.0,
            reps: 5,
            lapses: 0
        };

        const updateSpy = vi.spyOn(learningRepository, 'updateUserState').mockResolvedValue(undefined as any);

        const result = await submitReview(userId, kuId, facet, 'again', currentState);

        // (5 - 2) = 3 reps remaining according to smart reset
        expect(result.next_state.reps).toBe(3);
        expect(result.next_state.stage).toBe('learning');
        expect(result.next_state.lapses).toBe(1);

        expect(updateSpy).toHaveBeenCalledWith(userId, kuId, facet, expect.objectContaining({
            state: 'learning',
            reps: 3,
            lapses: 1
        }), 'again');
    });
});
