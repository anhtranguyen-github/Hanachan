import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview } from '@/features/learning/service';

vi.mock('next/headers', () => ({
    cookies: vi.fn().mockReturnValue(Promise.resolve({
        get: vi.fn().mockReturnValue({ value: 'mock-token' }),
        getAll: vi.fn().mockReturnValue([{ name: 'sb-test-auth-token', value: JSON.stringify(['mock-token']) }])
    }))
}));
vi.mock('@/services/backendClient', () => ({
    backendClient: {
        submitReview: vi.fn(),
    }
}));
import { backendClient } from '@/services/backendClient';

describe('Study Session Integration Flow', () => {
    const sessionId = 'session-test-1';
    const kuId = 'ku-test-1';
    const facet = 'meaning';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should forward a "pass" review to the backend', async () => {
        const backendResponse = {
            new_stability: 0.333,
            next_review: new Date().toISOString()
        };
        (backendClient.submitReview as any).mockResolvedValue(backendResponse);

        const result = await submitReview(sessionId, kuId, facet, 'pass', 1, 0);

        expect(backendClient.submitReview).toHaveBeenCalledWith({
            sessionId,
            kuId,
            facet,
            rating: 'pass',
            attemptCount: 1,
            wrongCount: 0,
        });
        expect(result).toEqual(backendResponse);
    });

    it('should forward an "again" review to the backend', async () => {
        const backendResponse = {
            new_stability: 5,
            next_review: new Date().toISOString()
        };
        (backendClient.submitReview as any).mockResolvedValue(backendResponse);

        const result = await submitReview(sessionId, kuId, facet, 'again', 3, 2);

        expect(backendClient.submitReview).toHaveBeenCalledWith({
            sessionId,
            kuId,
            facet,
            rating: 'again',
            attemptCount: 3,
            wrongCount: 2,
        });
        expect(result).toEqual(backendResponse);
    });
});
