
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lessonRepository } from '@/features/learning/lessonRepository';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn(), // We will mock this specifically to resolve the promise
    }
}));

describe('lessonRepository.countTodayBatches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should query lesson_batches table with correct date filter', async () => {
        // Mock the final call in the chain
        vi.mocked(supabase.gte).mockResolvedValue({ count: 5, error: null } as any);

        const userId = 'user-123';
        const result = await lessonRepository.countTodayBatches(userId);

        expect(supabase.from).toHaveBeenCalledWith('lesson_batches');
        expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
        // The actual implementation uses 'started_at' (not 'created_at')
        expect(supabase.gte).toHaveBeenCalledWith('started_at', expect.stringContaining('T00:00:00'));
        expect(result).toBe(5);
    });

    it('should return 0 on database error', async () => {
        vi.mocked(supabase.gte).mockResolvedValue({ count: null, error: { message: 'DB Error' } } as any);

        const result = await lessonRepository.countTodayBatches('user-123');
        expect(result).toBe(0);
    });
});
