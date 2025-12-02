
import { describe, it, expect } from 'vitest';
import { identifyTroubleItems, recommendTopics } from '../../src/features/chat/recommendation-engine';
import { pruneHistory, extractInterests } from '../../src/features/chat/context-manager';

describe('Recommendation Engine', () => {
    it('should identify trouble items', () => {
        const states = [
            { kuId: 'a', lapses: 5, difficulty: 5, state: 'Review' },
            { kuId: 'b', lapses: 0, difficulty: 2, state: 'Review' }
        ];
        expect(identifyTroubleItems(states)).toEqual(['a']);
    });

    it('should recommend level advance if enough mastered', () => {
        expect(recommendTopics(5, 25)).toContain('Level 6 Introduction');
    });
});

describe('Context Manager', () => {
    it('should prune long history', () => {
        const longHistory = new Array(15).fill({ role: 'user', content: 'test' });
        expect(pruneHistory(longHistory).length).toBe(10);
    });

    it('should extract interests', () => {
        const history = [{ role: 'user', content: 'I love anime and food.' }];
        expect(extractInterests(history as any)).toEqual(['anime', 'food']);
    });
});
