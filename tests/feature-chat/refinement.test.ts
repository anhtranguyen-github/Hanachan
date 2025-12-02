
import { describe, it, expect } from 'vitest';
import { calculateRefinementScore, isGoldenSentence } from '../../src/features/chat/refinement-logic';

describe('Refinement Logic', () => {
    it('should calculate weighted scores', () => {
        const score = calculateRefinementScore(70, 90);
        expect(score.overall).toBe(84); // (90*0.7) + (70*0.3) = 63 + 21 = 84
    });

    it('should identify golden sentences', () => {
        expect(isGoldenSentence(95, 15, 1)).toBe(true);
        expect(isGoldenSentence(80, 15, 1)).toBe(false); // Score too low
        expect(isGoldenSentence(95, 5, 1)).toBe(false);  // Too short
        expect(isGoldenSentence(95, 15, 2)).toBe(false); // Too complex (i+2)
    });
});
