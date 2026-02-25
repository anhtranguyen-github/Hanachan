
import { describe, it, expect } from 'vitest';
import { calculateNextReview } from '@/features/learning/domain/SRSAlgorithm';

describe('SRSAlgorithm', () => {
    const initialState = {
        stage: 'new',
        stability: 0.1,
        difficulty: 3.0,
        reps: 0,
        lapses: 0
    };

    it('should reset reps and increase lapses on "again"', () => {
        const result = calculateNextReview({ ...initialState, reps: 5, stability: 10 }, 'again');
        expect(result.next_state.reps).toBe(0);
        expect(result.next_state.lapses).toBe(1);
        expect(result.next_state.stability).toBeLessThan(10);
        expect(result.next_state.stage).toBe('learning');
    });

    it('should increase reps and stability on "pass"', () => {
        const result = calculateNextReview(initialState, 'pass');
        expect(result.next_state.reps).toBe(1);
        expect(result.next_state.stability).toBeGreaterThan(0.1);
        expect(result.next_state.stage).toBe('learning');
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
