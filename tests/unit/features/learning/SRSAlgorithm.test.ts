
import { describe, it, expect } from 'vitest';
import { calculateNextReview } from '@/features/learning/domain/SRSAlgorithm';

describe('SRSAlgorithm', () => {
    const initialState = {
        stage: 'new',
        stability: 0,
        difficulty: 3.0,
        reps: 0,
        lapses: 0
    };

    it('should reset progress on "again"', () => {
        // High stability item failed
        const result = calculateNextReview({
            stage: 'review',
            stability: 10,
            difficulty: 3.0,
            reps: 5,
            lapses: 0
        }, 'again');

        // Should lose reps, increase lapses
        expect(result.next_state.reps).toBe(3); // 5 - 2
        expect(result.next_state.lapses).toBe(1);
        // Stability should be roughly 40% of previous, min 0.1
        expect(result.next_state.stability).toBe(4);
        expect(result.next_state.stage).toBe('learning');
    });

    it('should follow fixed intervals for initial success', () => {
        // Rep 1 (first answer after Discovery)
        let state = { ...initialState };
        let result = calculateNextReview(state, 'good');
        expect(result.next_state.stability).toBe(0.166); // ~4 hours
        expect(result.next_state.reps).toBe(1);

        // Rep 2
        result = calculateNextReview(result.next_state, 'good');
        expect(result.next_state.stability).toBe(0.333); // ~8 hours
        expect(result.next_state.reps).toBe(2);

        // Rep 3
        result = calculateNextReview(result.next_state, 'good');
        expect(result.next_state.stability).toBe(1.0); // 1 day
        expect(result.next_state.reps).toBe(3);

        // Rep 4
        result = calculateNextReview(result.next_state, 'good');
        expect(result.next_state.stability).toBe(3.0); // 3 days
        expect(result.next_state.stage).toBe('review');
        expect(result.next_state.reps).toBe(4);
    });

    it('should use dynamic growth for higher intervals', () => {
        const matureState = {
            stage: 'review',
            stability: 10,
            difficulty: 3.0,
            reps: 5,
            lapses: 0
        };
        const result = calculateNextReview(matureState, 'good');
        // Factor 1.5 * Difficulty Adjustment (3/3 = 1) -> 10 * 1.5 = 15
        expect(result.next_state.stability).toBe(15);
        expect(result.next_state.reps).toBe(6);
    });

    it('should reach burned stage', () => {
        let state = {
            stage: 'review',
            stability: 100,
            difficulty: 3.0,
            reps: 10,
            lapses: 0
        };
        const result = calculateNextReview(state, 'good');
        // 100 * 1.5 = 150 > 120 (Burned threshold)
        expect(result.next_state.stability).toBe(150);
        expect(result.next_state.stage).toBe('burned');
    });

    it('should apply stability guard', () => {
        // Even if calculation results in lower stability, it should stay at current if success
        const weirdState = {
            stage: 'review',
            stability: 10,
            difficulty: 1.5, // Extreme difficulty (low multiplier)
            reps: 10,
            lapses: 0
        };
        const result = calculateNextReview(weirdState, 'good');
        // 10 * 1.5 * (1.5/3) = 7.5
        // Guard should keep it at 10
        expect(result.next_state.stability).toBe(10);
    });
});
