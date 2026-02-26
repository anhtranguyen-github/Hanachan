
import { describe, it, expect } from 'vitest';
import { FSRSEngine } from '@/features/learning/domain/FSRSEngine';

describe('FSRSEngine FIF Logic', () => {
    const initialState = {
        stage: 'review' as const,
        stability: 10,
        difficulty: 3.0,
        reps: 5,
        lapses: 0
    };

    it('should apply logarithmic penalty for wrongCount > 0', () => {
        // wrongCount = 1 -> Intensity = log2(1+1) = 1.0
        const result1 = FSRSEngine.calculateNextReview(initialState, 'good', 1);

        // Intensity 1.0 -> Stability * e^(-0.3 * 1.0) approx 10 * 0.74 = 7.4
        expect(result1.next_state.stability).toBeLessThan(10);
        expect(result1.next_state.stability).toBeGreaterThan(7.0);

        // Difficulty increase: 3.0 + (0.2 * 1.0) = 3.2
        expect(result1.next_state.difficulty).toBe(3.2);

        // wrongCount = 3 -> Intensity = log2(3+1) = 2.0
        const result3 = FSRSEngine.calculateNextReview(initialState, 'good', 3);

        // Intensity 2.0 -> Stability * e^(-0.3 * 2.0) approx 10 * 0.54 = 5.4
        expect(result3.next_state.stability).toBeLessThan(6.0);
        expect(result3.next_state.stability).toBeGreaterThan(5.0);

        // Difficulty increase: 3.0 + (0.2 * 2.0) = 3.4
        expect(result3.next_state.difficulty).toBe(3.4);
    });

    it('should cap intensity penalty at 3.0', () => {
        // wrongCount = 100 -> Intensity capped at 3.0
        const resultExtreme = FSRSEngine.calculateNextReview(initialState, 'good', 100);

        // Intensity 3.0 -> Stability * e^(-0.9) approx 10 * 0.4 = 4.0
        expect(resultExtreme.next_state.stability).toBeLessThan(4.1);
        expect(resultExtreme.next_state.stability).toBeGreaterThan(3.9);

        // Difficulty capped increase: 3.0 + (0.2 * 3.0) = 3.6
        expect(resultExtreme.next_state.difficulty).toBe(3.6);
    });

    it('should decrease difficulty on pure success (wrongCount = 0)', () => {
        const result = FSRSEngine.calculateNextReview(initialState, 'good', 0);

        // On success, difficulty should decrease: 3.0 - 0.1 = 2.9
        expect(result.next_state.difficulty).toBe(2.9);

        // Stability should increase significantly
        expect(result.next_state.stability).toBeGreaterThan(10);
    });

    it('should respect stability guard on success', () => {
        const hardState = {
            stage: 'review' as const,
            stability: 10,
            difficulty: 5.0, // Max difficulty
            reps: 10,
            lapses: 0
        };

        // Stability growth: 10 * 1.5 * (3/5) = 9
        // Stability Guard should keep it at 10
        const result = FSRSEngine.calculateNextReview(hardState, 'good', 0);
        expect(result.next_state.stability).toBe(10);
    });

    it('should handle minimum stability floor', () => {
        const lowState = {
            stage: 'learning' as const,
            stability: 0.166, // 4h
            difficulty: 5.0,
            reps: 1,
            lapses: 0
        };

        // Extremely heavy penalty: wrongCount = 7 (Intensity = 3.0)
        // 0.166 * e^-0.9 approx 0.06
        // Floor should catch it at 0.1 (2.4h)
        const result = FSRSEngine.calculateNextReview(lowState, 'good', 7);
        expect(result.next_state.stability).toBe(0.1);
    });
});
