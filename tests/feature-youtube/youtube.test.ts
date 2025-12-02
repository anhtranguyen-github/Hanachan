
import { describe, it, expect } from 'vitest';
import { groupTranscriptLines, cleanTranscriptText } from '../../src/features/youtube/transcript-logic';
import { calculateCoverage, isComprehensible } from '../../src/features/youtube/coverage-engine';

describe('Transcript Processing Logic', () => {
    it('should group lines until punctuation', () => {
        const lines = [
            { text: 'こんにちは', start: 0, duration: 1 },
            { text: '世界。', start: 1, duration: 1 },
            { text: '元気ですか？', start: 2, duration: 1 }
        ];
        const result = groupTranscriptLines(lines);
        expect(result.length).toBe(2);
        expect(result[0].text).toBe('こんにちは 世界。');
        expect(result[1].text).toBe('元気ですか？');
    });

    it('should clean metadata tags', () => {
        expect(cleanTranscriptText('This is [music] some text')).toBe('This is some text');
    });
});

describe('Coverage Engine', () => {
    it('should calculate accurate percentage', () => {
        const tokens = ['apple', 'banana', 'cherry', 'apple']; // 3 unique
        const known = new Set(['apple', 'banana']);
        const report = calculateCoverage(tokens, known);
        expect(report.coveragePercentage).toBeCloseTo(66.7, 1);
        expect(report.knownWords).toBe(2);
    });

    it('should identify comprehensible input', () => {
        const report = { coveragePercentage: 85 } as any;
        expect(isComprehensible(report)).toBe(true);
    });
});
