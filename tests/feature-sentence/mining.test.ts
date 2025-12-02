
import { describe, it, expect } from 'vitest';
import { validateForMining } from '../../src/features/sentence/mining-guardians';

describe('Mining Guardians', () => {
    it('should reject short sentences', () => {
        const result = validateForMining('猫。', { type: 'manual' }, 1);
        expect(result.isValid).toBe(false);
        expect(result.rejectionReason).toBe('Sentence too short');
    });

    it('should reject low quality youtube transcripts', () => {
        const result = validateForMining('Valid length sentence but low quality.', { type: 'youtube', qualityScore: 0.5 }, 1);
        expect(result.isValid).toBe(false);
        expect(result.rejectionReason).toContain('quality');
    });

    it('should approve valid candidates', () => {
        const result = validateForMining('This is a valid length sentence.', { type: 'chat' }, 1);
        expect(result.isValid).toBe(true);
    });
});
