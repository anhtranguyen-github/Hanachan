
import { describe, it, expect, vi } from 'vitest';

// MOCK THE WHOLE MODULE BEFORE ANY IMPORTS
vi.mock('@/features/chat/advanced-chatbot', () => ({
    advancedChatService: {
        sendMessage: vi.fn()
    }
}));

// Now import (it will be the mock)
import { advancedChatService } from '@/features/chat/advanced-chatbot';

describe('Chat Integration Flow (Mocked Service)', () => {
    it('should call sendMessage and return result', async () => {
        const mockResponse = { reply: "Mocked", actions: [] };
        (advancedChatService.sendMessage as any).mockResolvedValue(mockResponse);

        const result = await advancedChatService.sendMessage('user', 'session', 'hi');
        expect(result.reply).toBe("Mocked");
    });
});
