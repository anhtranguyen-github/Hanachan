
import { describe, it, expect, vi } from 'vitest';
import { learningRepository } from '@/features/learning/db';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
    }
}));

describe('learningRepository', () => {
    it('should fetch due items', async () => {
        const userId = 'user-1';
        const mockData = [{ id: 'state-1', ku_id: 'ku-1' }];

        // Mock for users check
        (supabase.from('users').select as any).mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: userId }, error: null })
        });

        // Mock for settings fetch
        (supabase.from('user_settings').select as any).mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({ data: mockSettings, error: null })
        });

        // Mock for settings upsert
        (supabase.from('user_settings').upsert as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockSettings, error: null })
        });

        const result = await learningRepository.getUserSettings(userId);
        expect(result).toEqual(mockSettings);
        expect(supabase.from('user_settings').upsert).toHaveBeenCalled();
    });
});
