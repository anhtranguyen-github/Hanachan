
import { describe, it, expect, vi } from 'vitest';
import { learningRepository } from '@/features/learning/db';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
        upsert: vi.fn(),
        insert: vi.fn(),
        maybeSingle: vi.fn(),
    }
}));

describe('learningRepository', () => {
    it('should fetch due items', async () => {
        const userId = 'user-1';
        const mockData = [{ id: 'state-1', ku_id: 'ku-1' }];

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_learning_states') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    neq: vi.fn().mockReturnThis(),
                    lte: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: mockData, error: null })
                };
            }
            return {};
        });

        const result = await learningRepository.fetchDueItems(userId);
        expect(result).toEqual(mockData);
        expect(supabase.from).toHaveBeenCalledWith('user_learning_states');
    });

    it('should update user state with upsert', async () => {
        const userId = 'user-1';
        const kuId = 'ku-1';
        const facet = 'meaning';
        const updates = { stability: 1.0 };

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'user_learning_states') {
                return {
                    upsert: vi.fn().mockResolvedValue({ error: null })
                };
            }
            if (table === 'user_learning_logs') {
                return {
                    insert: vi.fn().mockResolvedValue({ error: null })
                };
            }
            return {};
        });

        await learningRepository.updateUserState(userId, kuId, facet, updates, 'good' as any);
        expect(supabase.from).toHaveBeenCalledWith('user_learning_states');
        expect(supabase.from).toHaveBeenCalledWith('user_learning_logs');
    });
});
