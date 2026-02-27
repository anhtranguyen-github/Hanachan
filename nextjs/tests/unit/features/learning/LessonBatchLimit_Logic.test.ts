
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startLessonSession, fetchUserDashboardStats } from '@/features/learning/service';
import { lessonRepository } from '@/features/learning/lessonRepository';
import { srsRepository } from '@/features/learning/srsRepository';
import { analyticsService } from '@/features/analytics/service';

vi.mock('@/features/learning/lessonRepository', () => ({
    lessonRepository: {
        countTodayBatches: vi.fn(),
        fetchNewItems: vi.fn(),
        createLessonBatch: vi.fn(),
        createLessonItems: vi.fn(),
        countLearnedKUs: vi.fn()
    }
}));

vi.mock('@/features/learning/srsRepository', () => ({
    srsRepository: {
        fetchDueItems: vi.fn().mockResolvedValue([]),
        fetchStats: vi.fn().mockResolvedValue({
            learned: 10,
            mastered: 5,
            burned: 2,
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            last7Days: [0, 0, 0, 0, 0, 0, 0],
            heatmap: {},
            totalKUs: 100
        }),
        // fetchReviewForecast is required by fetchUserDashboardStats
        fetchReviewForecast: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('@/features/analytics/service', () => ({
    analyticsService: {
        getDashboardStats: vi.fn().mockResolvedValue({
            daily: { reviews: 0, retention: 90, minutes: 0 }
        })
    }
}));

describe('Lesson Batch Daily Limit', () => {
    const userId = 'user-limit-test';

    beforeEach(() => {
        vi.clearAllMocks();
        // Re-apply defaults after clearAllMocks
        vi.mocked(srsRepository.fetchDueItems).mockResolvedValue([]);
        vi.mocked(srsRepository.fetchStats).mockResolvedValue({
            learned: 10,
            mastered: 5,
            burned: 2,
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            last7Days: [0, 0, 0, 0, 0, 0, 0],
            heatmap: {},
            totalKUs: 100
        } as any);
        vi.mocked(srsRepository.fetchReviewForecast).mockResolvedValue([]);
        vi.mocked(analyticsService.getDashboardStats).mockResolvedValue({
            daily: { reviews: 0, retention: 90, minutes: 0 }
        } as any);
    });

    it('should allow starting a session when below the limit (e.g., 5 batches)', async () => {
        // Mock 5 batches today
        vi.mocked(lessonRepository.countTodayBatches).mockResolvedValue(5);
        vi.mocked(lessonRepository.fetchNewItems).mockResolvedValue([{ ku_id: '1' }] as any);
        vi.mocked(lessonRepository.createLessonBatch).mockResolvedValue({ id: 'batch-1' } as any);

        const result = await startLessonSession(userId, 1);

        expect(result.batch).not.toBeNull();
        expect(lessonRepository.createLessonBatch).toHaveBeenCalled();
    });

    it('should block starting a session when at the limit (10 batches)', async () => {
        // Mock 10 batches today
        vi.mocked(lessonRepository.countTodayBatches).mockResolvedValue(10);

        await expect(startLessonSession(userId, 1)).rejects.toThrow(/Daily limit reached/);

        expect(lessonRepository.createLessonBatch).not.toHaveBeenCalled();
    });

    it('should include todayBatchCount in dashboard stats', async () => {
        vi.mocked(lessonRepository.countTodayBatches).mockResolvedValue(7);

        const stats = await fetchUserDashboardStats(userId);

        expect(stats.todayBatchCount).toBe(7);
    });
});
