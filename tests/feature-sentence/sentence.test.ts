
import { describe, it, expect } from 'vitest';
import { mapTokensToUnits, extractUniqueKanji } from '../../src/features/sentence/token-processor';
import { matchGrammar } from '../../src/features/sentence/grammar-matcher';
import { canMineKU } from '../../src/features/sentence/mining-logic';

describe('Sentence Token Processing', () => {
    it('should map particles and nouns accurately', () => {
        const tokens = [
            { surface: '私', pos: '名詞' },
            { surface: 'は', pos: '助詞' }
        ];
        const units = mapTokensToUnits(tokens as any);
        expect(units[0].type).toBe('vocabulary');
        expect(units[1].type).toBe('particle');
    });

    it('should extract unique kanji', () => {
        expect(extractUniqueKanji('日本語は面白い日本')).toEqual(['日', '本', '語', '面', '白']);
    });
});

describe('Grammar Matcher', () => {
    it('should match multiple patterns and handle overlapping', () => {
        const patterns = [
            { slug: 'short', regex: 'い' },
            { slug: 'long', regex: '面白い' }
        ];
        const matches = matchGrammar('面白い', patterns);
        expect(matches).toEqual(['long']); // Should pick longest
    });
});

describe('Sentence Mining Logic', () => {
    it('should validate mining candidates', () => {
        const context = { sentenceId: '1', text: '猫が好きです。' };
        expect(canMineKU('猫', context)).toBe(true);
        expect(canMineKU('犬', context)).toBe(false);
    });
});
