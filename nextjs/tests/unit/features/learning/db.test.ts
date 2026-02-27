
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { srsRepository } from '@/features/learning/srsRepository';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
}));

describe('srsRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Re-apply chain mocks after clearAllMocks
        vi.mocked(supabase.from).mockReturnThis();
        vi.mocked(supabase.select).mockReturnThis();
        vi.mocked(supabase.eq).mockReturnThis();
        vi.mocked(supabase.neq).mockReturnThis();
        vi.mocked(supabase.lte).mockReturnThis();
        vi.mocked(supabase.order).mockResolvedValue({ data: [], error: null } as any);
    });

    it('should call fetchDueItems with correct table and filters', async () => {
        const userId = 'user-1';
        const mockData = [
            { id: 'state-1', ku_id: 'ku-1', state: 'learning', next_review: new Date().toISOString() }
        ];

        vi.mocked(supabase.order).mockResolvedValue({ data: mockData, error: null } as any);

        const result = await srsRepository.fetchDueItems(userId);

        expect(supabase.from).toHaveBeenCalledWith('user_learning_states');
        expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
        expect(supabase.neq).toHaveBeenCalledWith('state', 'burned');
        expect(result).toEqual(mockData);
    });
});
