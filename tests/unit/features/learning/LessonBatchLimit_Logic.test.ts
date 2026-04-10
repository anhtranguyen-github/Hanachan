
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startLessonSession, fetchUserDashboardStats } from '@/features/learning/service';

vi.mock('next/headers', () => ({
    cookies: vi.fn().mockReturnValue(Promise.resolve({
        get: vi.fn().mockReturnValue({ value: 'mock-token' }),
        getAll: vi.fn().mockReturnValue([{ name: 'sb-mock-auth-token', value: '{"access_token":"mock"}' }])
    }))
}));

const { mockBackendClient } = vi.hoisted(() => {
    return {
        mockBackendClient: {
            startLessonSession: vi.fn().mockResolvedValue({ success: true, batch_id: 'sess-1' }),
            getDeckDashboard: vi.fn().mockResolvedValue({
                reviewsDue: 0,
                totalLearned: 0,
                totalBurned: 0,
                recentLevels: [1, 2, 3],
                retention: 0.9,
                actionFrequencies: { analyze: 0, flashcard: 0, srs: 0 },
                dailyReviews: [0, 0, 0, 0, 0, 0, 0],
                forecast: { hourly: [], daily: [], total: 0 },
                heatmap: {},
                typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
                totalKUCoverage: 0,
                streak: 0,
                minutesSpent: 0,
                dueBreakdown: { learning: 0, review: 0 },
                todayBatchCount: 0,
            })
        }
    };
});

vi.mock('@/services/backendClient', () => {
    return {
        backendClient: mockBackendClient,
        BackendClient: vi.fn().mockImplementation(() => mockBackendClient)
    };
});

describe('Lesson Batch Daily Limit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should pass unit ids through to the backend lesson session endpoint', async () => {
        const result = await startLessonSession(['ku-1', 'ku-2'], 1);

        expect(result).toEqual({ success: true, batch_id: 'sess-1' });
        expect(mockBackendClient.startLessonSession).toHaveBeenCalledWith(['ku-1', 'ku-2'], 1, undefined);
    });

    it('should include todayBatchCount in dashboard stats', async () => {
        mockBackendClient.getDeckDashboard.mockResolvedValueOnce({
            reviewsDue: 0,
            totalLearned: 0,
            totalBurned: 0,
            recentLevels: [1, 2, 3],
            retention: 0.9,
            actionFrequencies: { analyze: 0, flashcard: 0, srs: 0 },
            dailyReviews: [0, 0, 0, 0, 0, 0, 0],
            forecast: { hourly: [], daily: [], total: 0 },
            heatmap: {},
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            totalKUCoverage: 0,
            streak: 0,
            minutesSpent: 0,
            dueBreakdown: { learning: 0, review: 0 },
            todayBatchCount: 7,
        });

        const stats = await fetchUserDashboardStats();

        expect(stats.todayBatchCount).toBe(7);
        expect(mockBackendClient.getDeckDashboard).toHaveBeenCalledWith(undefined);
    });
});
