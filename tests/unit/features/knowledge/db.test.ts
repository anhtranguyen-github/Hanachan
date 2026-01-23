
import { describe, it, expect, vi } from 'vitest';
import { kuRepository } from '@/features/knowledge/db';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
    }
}));

describe('kuRepository', () => {
    it('should fetch KU by slug', async () => {
        const mockKU = { id: '1', slug: 'kanji:test', type: 'kanji', details: { meaning_data: { primary: ['test'] } } };
        (supabase.from('knowledge_units').select as any).mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockKU, error: null }),
            limit: vi.fn().mockReturnThis()
        });

        const result = await kuRepository.getBySlug('test', 'kanji');
        expect(result).toBeDefined();
        expect(result?.slug).toBe('kanji:test');
    });

    it('should fetch grammar relations', async () => {
        const mockRelations = [
            { related: { id: '2', slug: 'similar' }, type: 'SIMILAR', comparison_note: 'note' }
        ];

        vi.spyOn(supabase.from('grammar_relations'), 'select').mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockRelations, error: null })
        } as any);

        const result = await kuRepository.getGrammarRelations('1');
        expect(result).toHaveLength(1);
    });
});
