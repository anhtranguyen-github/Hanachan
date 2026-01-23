
import { describe, it, expect, vi } from 'vitest';
import { learningRepository } from '@/features/learning/db';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn()
    }
}));

describe('learningRepository', () => {
    it('should fetch user settings or create default if missing', async () => {
        const userId = 'user-1';
        const mockSettings = { user_id: userId, target_retention: 0.9 };

        (supabase.from('user_settings').select as any).mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({ data: mockSettings, error: null })
        });

        (supabase.from('user_settings').insert as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockSettings, error: null })
        });

        const result = await learningRepository.getUserSettings(userId);
        expect(result).toEqual(mockSettings);
        expect(supabase.from('user_settings').insert).toHaveBeenCalled();
    });
});
