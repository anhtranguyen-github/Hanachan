
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sentenceService } from '../../src/features/sentence/service';
import * as db from '../../src/features/sentence/db';

vi.mock('../../src/features/sentence/db', () => ({
    createSentence: vi.fn(),
    linkKUToSentence: vi.fn()
}));

describe('Sentence Mining Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a sentence and link KUs during mining', async () => {
        const sentenceId = 's_1';
        (db.createSentence as any).mockResolvedValue({ id: sentenceId, text_ja: '猫が好き' });

        const result = await sentenceService.mine({
            userId: 'u1',
            text_ja: '猫が好き',
            text_en: 'I like cats',
            source_type: 'manual',
            selected_ku_slugs: ['猫', '好き'],
            cloze_positions: [0]
        });

        expect(result?.id).toBe(sentenceId);
        expect(db.createSentence).toHaveBeenCalled();
        expect(db.linkKUToSentence).toHaveBeenCalledTimes(2);
        expect(db.linkKUToSentence).toHaveBeenCalledWith(expect.objectContaining({ ku_id: '猫' }));
    });
});
