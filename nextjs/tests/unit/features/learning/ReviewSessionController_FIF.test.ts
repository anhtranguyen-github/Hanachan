
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewSessionController } from '@/features/learning/ReviewSessionController';
import { srsRepository } from '@/features/learning/srsRepository';
import { submitReview } from '@/features/learning/service';

// Mock the dependencies
vi.mock('@/features/learning/srsRepository', () => ({
    srsRepository: {
        updateReviewSessionItem: vi.fn(),
        incrementSessionProgress: vi.fn(),
        finishReviewSession: vi.fn(),
        createReviewSession: vi.fn().mockResolvedValue({ id: 'mock-session-id' }),
        createReviewSessionItems: vi.fn().mockResolvedValue({})
    }
}));

vi.mock('@/features/learning/service', () => ({
    submitReview: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/features/learning/questionRepository', () => ({
    questionRepository: {
        fetchQuestionsBatch: vi.fn().mockResolvedValue([])
    }
}));

describe('ReviewSessionController (FIF Mechanics)', () => {
    const userId = 'user-123';
    const mockItems = [
        {
            id: '1-meaning',
            ku_id: '1',
            facet: 'meaning',
            state: 'review',
            stability: 10,
            difficulty: 3,
            reps: 5,
            lapses: 0,
            knowledge_units: {
                character: 'one',
                meaning: 'one',
                type: 'kanji',
                vocabulary_details: [],
                kanji_details: [{ onyomi: ['ichi'] }]
            }
        },
        {
            id: '2-meaning',
            ku_id: '2',
            facet: 'meaning',
            state: 'review',
            stability: 10,
            difficulty: 3,
            reps: 5,
            lapses: 0,
            knowledge_units: {
                character: 'two',
                meaning: 'two',
                type: 'kanji',
                vocabulary_details: [],
                kanji_details: [{ onyomi: ['ni'] }]
            }
        }
    ];

    let controller: ReviewSessionController;

    beforeEach(async () => {
        vi.clearAllMocks();
        controller = new ReviewSessionController(userId);
        await controller.initSession(mockItems as any);
    });

    it('should implement the "Drill then Commit" flow', async () => {
        // First item fail — 'again' is the only failure rating
        const success1 = await controller.submitAnswer('again');

        expect(success1).toBe(false);
        // Should NOT call submitReview on fail (FIF Rule)
        expect(submitReview).not.toHaveBeenCalled();

        // Should update repository as 'incorrect'
        expect(srsRepository.updateReviewSessionItem).toHaveBeenCalledWith(
            expect.any(String), '1', 'meaning', 'incorrect', 'again', 1, 1
        );

        // Queue check: item 1 should be moved to the back
        const next = controller.getNextItem();
        expect(next!.id).toBe('2-meaning');

        // Answer second item correctly — 'pass' is the success rating
        const success2 = await controller.submitAnswer('pass');
        expect(success2).toBe(true);
        // Should call submitReview (Commit)
        expect(submitReview).toHaveBeenCalledWith(userId, '2', 'meaning', 'pass', expect.any(Object), 0);

        // Answer first item correctly (second attempt)
        const success3 = await controller.submitAnswer('pass');
        expect(success3).toBe(true);
        // Should call submitReview with wrongCount = 1
        expect(submitReview).toHaveBeenCalledWith(userId, '1', 'meaning', 'pass', expect.any(Object), 1);

        expect(srsRepository.updateReviewSessionItem).toHaveBeenCalledWith(
            expect.any(String), '1', 'meaning', 'correct', 'pass', 1, 2
        );
    });

    it('should finish session when all items are committed', async () => {
        // Answer both items correctly with 'pass'
        await controller.submitAnswer('pass');
        await controller.submitAnswer('pass');

        expect(controller.getNextItem()).toBeNull();
        expect(srsRepository.finishReviewSession).toHaveBeenCalled();
    });
});
