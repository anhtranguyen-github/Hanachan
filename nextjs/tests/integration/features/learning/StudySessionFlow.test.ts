import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview } from '@/features/learning/service';
import { srsRepository } from '@/features/learning/srsRepository';

vi.mock('next/headers', () => ({
    cookies: vi.fn().mockReturnValue(Promise.resolve({
        get: vi.fn().mockReturnValue({ value: 'mock-token' }),
        getAll: vi.fn().mockReturnValue([{ name: 'sb-test-auth-token', value: JSON.stringify(['mock-token']) }])
    }))
}));
vi.mock('@/features/learning/srsRepository');
vi.mock('@/features/analytics/service', () => ({
    analyticsService: {
        logReview: vi.fn().mockResolvedValue(undefined),
    }
}));
vi.mock('@/lib/domain-client', () => ({
    domainClient: {
        submitReview: vi.fn(),
    }
}));
import { domainClient } from '@/lib/domain-client';

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
        (domainClient.submitReview as any).mockResolvedValue({
            new_stability: 0.333,
            next_review: new Date().toISOString()
        });

        // Correct signature: (userId, unitId, facet, rating, currentState, wrongCount)
        const result = await submitReview(userId, kuId, facet, 'pass', currentState);

        // Based on current service.ts bridge implementation
        expect(result.next_state.stability).toBe(0.333);
        expect(result.next_review).toBeInstanceOf(Date);
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
        (domainClient.submitReview as any).mockResolvedValue({
            new_stability: 5,
            next_review: new Date().toISOString()
        });

        // Correct signature: (userId, unitId, facet, rating, currentState, wrongCount)
        const result = await submitReview(userId, kuId, facet, 'again', currentState);

        // Stability = 10 * 0.5 = 5
        expect(result.next_state.stability).toBe(5);
    });
});
