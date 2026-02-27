
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

        // 'again' resets reps to 0 and increments lapses
        expect(result.next_state.reps).toBe(0);
        expect(result.next_state.lapses).toBe(1);
        // Stability should be 50% of previous: 10 * 0.5 = 5
        expect(result.next_state.stability).toBe(5);
        expect(result.next_state.stage).toBe('learning');
    });

    it('should increase reps and stability on "pass"', () => {
        let result = calculateNextReview(initialState, 'pass');
        expect(result.next_state.reps).toBe(1);

        // Rep 2
        result = calculateNextReview(result.next_state, 'pass');
        expect(result.next_state.stability).toBe(0.333); // ~8 hours
        expect(result.next_state.reps).toBe(2);

        // Rep 3
        result = calculateNextReview(result.next_state, 'pass');
        expect(result.next_state.stability).toBe(1.0); // 1 day
        expect(result.next_state.reps).toBe(3);

        // Rep 4
        result = calculateNextReview(result.next_state, 'pass');
        expect(result.next_state.stability).toBe(3.0); // 3 days
        expect(result.next_state.stage).toBe('review');
        expect(result.next_state.reps).toBe(4);
    });

    it('should progress to review stage when stability passes threshold', () => {
        let state = initialState;
        // The FSRSEngine passes REVIEW_THRESHOLD_DAYS (3 days) at reps 5
        for (let i = 0; i < 5; i++) {
            const result = calculateNextReview(state, 'pass');
            state = result.next_state;
        }
        expect(state.stage).toBe('review');
        expect(state.stability).toBeGreaterThanOrEqual(3.0);
    });


    it('should eventually reach burned stage', () => {
        let state = initialState;
        // Stability should eventually cross 120 days
        for (let i = 0; i < 20; i++) {
            const result = calculateNextReview(state, 'pass');
            state = result.next_state;
        }
        expect(state.stage).toBe('burned');
        expect(state.stability).toBeGreaterThanOrEqual(120);
    });
});
