
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

    it('should cap intensity penalty at 4.0 (not 3.0)', () => {
        // wrongCount = 100 -> log2(101) ≈ 6.66, capped at 4.0
        const resultExtreme = FSRSEngine.calculateNextReview(initialState, 'good', 100);

        // Intensity 4.0 -> Stability * e^(-0.3 * 4.0) = 10 * e^(-1.2) ≈ 10 * 0.301 ≈ 3.01
        expect(resultExtreme.next_state.stability).toBeLessThan(3.5);
        expect(resultExtreme.next_state.stability).toBeGreaterThan(2.5);

        // Difficulty capped increase: 3.0 + (0.2 * 4.0) = 3.8
        expect(resultExtreme.next_state.difficulty).toBe(3.8);
    });

    it('should decrease difficulty on pure success (wrongCount = 0)', () => {
        const result = FSRSEngine.calculateNextReview(initialState, 'good', 0);

        // On success, difficulty should decrease: 3.0 - 0.1 = 2.9
        expect(result.next_state.difficulty).toBe(2.9);

        // Stability should increase significantly (FSRS growth)
        expect(result.next_state.stability).toBeGreaterThan(10);
    });

    it('should grow stability on success (guard only prevents drops)', () => {
        const hardState = {
            stage: 'review' as const,
            stability: 10,
            difficulty: 5.0, // Max difficulty
            reps: 10,
            lapses: 0
        };

        // FSRS growth: stability * factor * (1 + (5 - difficulty) * 0.1)
        // = 10 * 1.65 * (1 + 0) = 16.65
        // Guard: Math.max(new_stability, current.stability) = Math.max(16.65, 10) = 16.65
        const result = FSRSEngine.calculateNextReview(hardState, 'good', 0);
        // Stability should grow (guard only prevents drops, not caps growth)
        expect(result.next_state.stability).toBeGreaterThan(10);
    });

    it('should handle minimum stability floor', () => {
        const lowState = {
            stage: 'learning' as const,
            stability: 0.166, // 4h
            difficulty: 5.0,
            reps: 1,
            lapses: 0
        };

        // Extremely heavy penalty: wrongCount = 7 (Intensity = log2(8) = 3.0)
        // 0.166 * e^(-0.3 * 3.0) = 0.166 * e^(-0.9) ≈ 0.166 * 0.407 ≈ 0.0675
        // Floor should catch it at 0.1 (2.4h)
        const result = FSRSEngine.calculateNextReview(lowState, 'good', 7);
        expect(result.next_state.stability).toBe(0.1);
    });
});
