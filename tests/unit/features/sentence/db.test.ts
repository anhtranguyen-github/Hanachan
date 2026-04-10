
import { describe, it, expect, vi } from 'vitest';
import { sentenceRepository } from '@/features/sentence/db';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
        upsert: vi.fn().mockReturnThis()
    }
}));

describe('sentenceRepository', () => {
    it('should create a cloze card and a flashcard', async () => {
        const mockCloze = { id: 'cloze-1', sentence_id: 's-1', focus_ku_id: 'ku-1' };

        (supabase.from('cloze_sentence_cards').insert as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCloze, error: null })
        });

        const flashcardInsertSpy = vi.spyOn(supabase.from('flashcards'), 'insert');

        const result = await sentenceRepository.createClozeCard({
            sentence_id: 's-1',
            focus_ku_id: 'ku-1',
            cloze_data: { text: '[...]', cloze_index: 0 }
        });

        expect(result).toEqual(mockCloze);
        expect(flashcardInsertSpy).toHaveBeenCalledWith({
            cloze_id: 'cloze-1',
            card_type: 'cloze'
        });
    });
});
