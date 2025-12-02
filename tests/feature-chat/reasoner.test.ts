
import { describe, it, expect } from 'vitest';
import { structureExplanation } from '../../src/features/chat/explanation-engine';
import { recommendStudyAction, shouldRefine } from '../../src/features/chat/study-support-logic';
import { generatePractice } from '../../src/features/chat/practise-generator';

describe('Explanation Engine', () => {
    it('should group units by type', () => {
        const units = [
            { surface: '猫', type: 'vocabulary', metadata: { base: '猫' } },
            { surface: 'だ', type: 'grammar' }
        ];
        const blocks = structureExplanation(units as any);
        expect(blocks.length).toBe(2);
        expect(blocks[0].title).toBe('Vocabulary Breakdown');
    });
});

describe('Study Support Logic', () => {
    it('should recommend review if queue is high', () => {
        const recommendation = recommendStudyAction(25, 0);
        expect(recommendation.action).toBe('START_REVIEW');
    });

    it('should trigger refinement for unpunctuated long sentences', () => {
        expect(shouldRefine('This is a very long sentences with no Japanese punctuation at the end')).toBe(true);
        expect(shouldRefine('短い。')).toBe(false);
    });
});

describe('Practice Generator', () => {
    it('should generate translation prompt for high lapse items', () => {
        const state = { kuId: 'k1', lapses: 5, difficulty: 5, state: 'Review' };
        const practice = generatePractice(state, '猫');
        expect(practice.type).toBe('TRANSLATION');
        expect(practice.prompt).toContain('猫');
    });
});
