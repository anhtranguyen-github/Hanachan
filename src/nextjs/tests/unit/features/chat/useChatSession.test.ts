import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatSession } from '@/features/chat/hooks/useChatSession';
import { chatClient } from '@/services/chatClient';
import { browserAgentsClient } from '@/services/browserAgentsClient';

// Mock dependencies
vi.mock('@/services/chatClient', () => ({
    chatClient: {
        streamChat: vi.fn(),
    }
}));
vi.mock('@/services/browserAgentsClient', () => ({
    browserAgentsClient: {
        listThreads: vi.fn().mockResolvedValue([]),
        createThread: vi.fn().mockResolvedValue({ id: 'thread-123' }),
        getThread: vi.fn().mockResolvedValue({ id: 'thread-123', title: 'Test', summary: 'Summary' }),
    }
}));
vi.mock('@/features/auth/AuthContext', () => ({
    useAuth: () => ({ openLoginModal: vi.fn() }),
}));

// Helper to create a mocked ReadableStream that yields strings
function createMockStream(chunks: string[]) {
    return new ReadableStream({
        async start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
                // Add a small delay to simulate network/streaming
                await new Promise(r => setTimeout(r, 10));
            }
            controller.close();
        }
    });
}

describe('useChatSession Stream and Traces', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('accumulates thought and token events into streaming traces and partial content', async () => {
        // Prepare mock SSE output
        const chunks = [
            `data: ${JSON.stringify({ type: 'thought', content: 'Analyzing question...', node: 'router', label: 'Router', phase: 'complete' })}\n\n`,
            `data: ${JSON.stringify({ type: 'status', content: 'Thinking hard', tool_name: 'search_memory', phase: 'start', meta: { query: 'Hi there' } })}\n\n`,
            `data: ${JSON.stringify({ type: 'token', content: 'Hel' })}\n\n`,
            `data: ${JSON.stringify({ type: 'token', content: 'lo!' })}\n\n`,
            `data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`,
        ];
        
        vi.mocked(chatClient.streamChat).mockResolvedValue(createMockStream(chunks) as any);

        const { result } = renderHook(() => useChatSession('user-1'));

        // Start stream
        await act(async () => {
            // Need to wrap in an async IIFE to fire and forget so we can read states in between
            // but for simplicity in jsdom tests, awaiting it will run it to completion.
            await result.current.sendMessageStreaming('Hi there');
        });

        // After completion:
        // 1. streaming should be false and reset
        expect(result.current.streaming.isStreaming).toBe(false);
        expect(result.current.streaming.traces).toEqual([]);
        
        // 2. The persistent message array should have exactly 2 messages (user + assistant)
        const msgs = result.current.messages;
        expect(msgs).toHaveLength(2);
        
        const assistantMsg = msgs[1];
        expect(assistantMsg.role).toBe('assistant');
        expect(assistantMsg.content).toBe('Hello!');
        
        // 3. The persistent message should contain the two traces
        expect(assistantMsg.traces).toEqual([
            { type: 'thought', content: 'Analyzing question...', node: 'router', label: 'Router', phase: 'complete' },
            { type: 'status', content: 'Thinking hard', tool_name: 'search_memory', phase: 'start', meta: { query: 'Hi there' } }
        ]);
    });
});
