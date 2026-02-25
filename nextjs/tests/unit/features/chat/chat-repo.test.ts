
import { describe, it, expect, vi } from 'vitest';
import { chatRepo } from '@/features/chat/chat-repo';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn()
    }
}));

describe('ChatRepository', () => {
    it('should add message and log actions if present', async () => {
        const mockMsgId = 'msg-123';
        (supabase.from('chat_messages').insert as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockMsgId }, error: null })
        });

        const logActionSpy = vi.spyOn(chatRepo, 'logAction');

        const sessionId = '00000000-0000-0000-0000-000000000001';
        await chatRepo.addMessage(sessionId, {
            role: 'assistant',
            content: 'Hello',
            timestamp: new Date().toISOString(),
            metadata: {
                actions: [{ type: 'analyze', data: { ku_id: 'target-1' } }]
            }
        });

        expect(logActionSpy).toHaveBeenCalledWith(mockMsgId, expect.objectContaining({ type: 'analyze' }));
    });
});
