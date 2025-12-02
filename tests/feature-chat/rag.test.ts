
import { describe, it, expect } from 'vitest';
import { rerankResults } from '../../src/features/chat/retrieval-logic';
import { formatRAGContext, shouldAugment } from '../../src/features/chat/rag-strategy';

describe('RAG Retrieval Logic', () => {
    it('should boost scores for trouble items', () => {
        const results = [
            { ku: { id: 'ku_ok' } as any, score: 0.5 },
            { ku: { id: 'ku_hard' } as any, score: 0.5 }
        ];
        const states = {
            'ku_hard': { kuId: 'ku_hard', lapses: 5, difficulty: 8, state: 'Review' }
        };
        const ranked = rerankResults(results, states as any);
        expect(ranked[0].ku.id).toBe('ku_hard');
        expect(ranked[0].score).toBe(1.0); // 0.5 + 0.5
    });
});

describe('RAG Strategy', () => {
    it('should format context clearly', () => {
        const kus = [{ character: '猫', meaning: 'Cat', type: 'vocabulary', level: 1 }];
        const context = formatRAGContext(kus as any);
        expect(context).toContain('猫');
        expect(context).toContain('Cat');
    });

    it('should determine when to augment', () => {
        expect(shouldAugment([0.8, 0.4])).toBe(true);
        expect(shouldAugment([0.5, 0.6])).toBe(false);
    });
});
