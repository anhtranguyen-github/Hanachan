
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessageAction, getSessionHistoryAction, createSessionAction, getUserSessionsAction } from '../actions';
import { ChatMessage, ChatSession } from '../types';
import { browserAgentsClient } from '@/services/browserAgentsClient';
import { chatClient } from '@/services/chatClient';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { AgentSession, AgentThreadMessage, StreamTraceEvent } from '@/types/chat';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamingState {
    isStreaming: boolean;
    partial: string;
    traces: StreamTraceEvent[];
}

function mapThreadMessage(message: AgentThreadMessage): ChatMessage {
    return {
        role: message.role,
        content: message.content,
        timestamp: message.timestamp ?? message.created_at ?? new Date().toISOString(),
        metadata: message.metadata ?? undefined,
        traces: message.traces ?? message.metadata?.traces ?? undefined,
    };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChatSession(userId?: string, conversationId?: string) {
    const { openLoginModal } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);

    // Thread state (chat containers)
    const [threads, setThreads] = useState<AgentSession[]>([]);
    const [activeThread, setActiveThread] = useState<AgentSession | null>(null);
    const [streaming, setStreaming] = useState<StreamingState>({ isStreaming: false, partial: '', traces: [] });
    const [sessionTitle, setSessionTitle] = useState<string | null>(null);
    const [sessionSummary, setSessionSummary] = useState<string | null>(null);

    // Track the thread_id independently from the Supabase session_id
    const memorySessionIdRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // ---------------------------------------------------------------------------
    // Supabase session management (existing)
    // ---------------------------------------------------------------------------

    const loadHistory = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const session = await getSessionHistoryAction(id);
            if (session) {
                setMessages(session.messages);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadSessions = useCallback(async () => {
        if (!userId) return;
        const data = await getUserSessionsAction(userId);
        setSessions(data || []);
    }, [userId]);

    useEffect(() => { loadSessions(); }, [loadSessions]);

    useEffect(() => {
        if (conversationId) {
            loadHistory(conversationId);
        }
    }, [conversationId, loadHistory]);

    // ---------------------------------------------------------------------------
    // Thread management (backed by memory service)
    // ---------------------------------------------------------------------------

    const loadMemorySessions = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            console.log('[useChatSession] Loading memory sessions for user:', userId);
            const data = await browserAgentsClient.listThreads();
            console.log('[useChatSession] Threads loaded:', data.length);
            setThreads(data);
        } catch (error) {
            console.error('[useChatSession] Failed to load memory sessions:', error);
            // Memory API may be offline
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => { loadMemorySessions(); }, [loadMemorySessions]);

    /** Load or create the chat thread paired to this Supabase conversation. */
    const ensureMemorySession = useCallback(async (): Promise<string | null> => {
        if (!userId) return null;
        if (memorySessionIdRef.current) return memorySessionIdRef.current;
        try {
            const session = await browserAgentsClient.createThread({
                config_override: {
                    supabase_session_id: conversationId ?? null,
                }
            });
            const sid = session.id;
            memorySessionIdRef.current = sid;
            setActiveThread(session);
            setSessionTitle(session.title ?? null);
            setSessionSummary(session.summary ?? null);
            return sid;
        } catch {
            return null;
        }
    }, [userId, conversationId]);

    /** Refresh the title and summary from the thread API (after a response). */
    const refreshMemorySessionMeta = useCallback(async () => {
        const sid = memorySessionIdRef.current;
        if (!sid) return;
        try {
            const data = await browserAgentsClient.getThread(sid);
            if (data.title) setSessionTitle(data.title);
            if (data.summary) setSessionSummary(data.summary);
            setActiveThread(data);
        } catch {
            // ignore
        }
    }, []);

    // ---------------------------------------------------------------------------
    // Thread history
    // ---------------------------------------------------------------------------

    /** Load messages from a specific memory thread. */
    const loadThreadHistory = useCallback(async (memSessionId: string) => {
        setIsLoading(true);
        try {
            console.log('[useChatSession] Loading thread history:', memSessionId);
            const [thread, threadMessages] = await Promise.all([
                browserAgentsClient.getThread(memSessionId),
                browserAgentsClient.getThreadMessages(memSessionId),
            ]);
            console.log('[useChatSession] Messages loaded:', threadMessages.length);
            const mapped = threadMessages.map(mapThreadMessage);
            setMessages(mapped);
            setSessionTitle(thread.title ?? null);
            setSessionSummary(thread.summary ?? null);
            setActiveThread(thread);
            memorySessionIdRef.current = memSessionId;
        } catch (error) {
            console.error('[useChatSession] Failed to load thread history:', error);
            // fall back to Supabase history
            if (conversationId) await loadHistory(conversationId);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, loadHistory]);

    // ---------------------------------------------------------------------------
    // Streaming send message
    // ---------------------------------------------------------------------------

    const sendMessageStreaming = useCallback(async (content: string, ttsEnabled?: boolean): Promise<void> => {
        if (!userId) return;

        const memSessionId = await ensureMemorySession();

        // Optimistic user message
        const userMsg: ChatMessage = {
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setStreaming({ isStreaming: true, partial: '', traces: [] });

        // Cancel any previous stream
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        try {
            const stream = await chatClient.streamChat(
                {
                    message: content,
                    user_id: userId,
                    session_id: memSessionId,
                    tts_enabled: ttsEnabled,
                },
                { signal: abortControllerRef.current.signal },
            );

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event = JSON.parse(line.slice(6));

                        if (event.type === 'token') {
                            fullResponse += event.content;
                            setStreaming(s => ({ ...s, partial: s.partial + event.content }));
                        } else if (event.type === 'thought' || event.type === 'status') {
                            setStreaming(s => ({
                                ...s,
                                traces: [...s.traces, event satisfies StreamTraceEvent]
                            }));
                        } else if (event.type === 'done') {
                            // Commit the full streaming response as a real message
                            setStreaming(s => {
                                setMessages(prev => [
                                    ...prev,
                                    {
                                        role: 'assistant',
                                        content: fullResponse,
                                        timestamp: new Date().toISOString(),
                                        traces: s.traces,
                                    },
                                ]);
                                return { isStreaming: false, partial: '', traces: [] };
                            });

                            // Update title + summary from memory API (async)
                            await refreshMemorySessionMeta();

                            // Update sessions list
                            await loadMemorySessions();
                        } else if (event.type === 'error') {
                            throw new Error(event.message);
                        }
                    } catch {
                        // malformed event, skip
                    }
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Stream reader error:', err);
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: '⚠️ Failed to get a response. Please try again.',
                        timestamp: new Date().toISOString(),
                    },
                ]);
            }
            setStreaming({ isStreaming: false, partial: '', traces: [] });
        }
    }, [userId, ensureMemorySession, refreshMemorySessionMeta, loadMemorySessions]);

    // ---------------------------------------------------------------------------
    // Regular (non-streaming) send message — kept for fallback/compatibility
    // ---------------------------------------------------------------------------

    const sendMessage = useCallback(async (content: string) => {
        if (!userId || !conversationId) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const result = await sendMessageAction(conversationId, userId, content) as any;
            if (result.success && result.reply) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.reply!,
                    timestamp: new Date().toISOString(),
                }]);
                // Refresh title/summary
                await refreshMemorySessionMeta();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, conversationId, refreshMemorySessionMeta]);

    // ---------------------------------------------------------------------------
    // Session lifecycle
    // ---------------------------------------------------------------------------

    const createNewConversation = useCallback(async () => {
        if (!userId) return null;
        // Reset thread so next message creates a fresh one
        memorySessionIdRef.current = null;
        setSessionTitle(null);
        setSessionSummary(null);
        setActiveThread(null);
        setMessages([]);
        return null;
    }, [userId]);

    const endCurrentThread = useCallback(async () => {
        const sid = memorySessionIdRef.current;
        if (!sid) return;
        try {
            const result = await browserAgentsClient.deleteThread(sid);
            setSessionTitle(result.title ?? null);
            setSessionSummary(result.summary ?? null);
        } catch {
            // ignore
        } finally {
            memorySessionIdRef.current = null;
            await loadMemorySessions();
        }
    }, [loadMemorySessions]);

    const renameThread = useCallback(async (title: string) => {
        const sid = memorySessionIdRef.current;
        if (!sid) return;
        try {
            await browserAgentsClient.updateThread(sid, { title });
            setSessionTitle(title);
            await loadMemorySessions();
        } catch {
            // ignore
        }
    }, [loadMemorySessions]);

    // Stop the current stream
    const stopStream = useCallback(() => {
        abortControllerRef.current?.abort();
        setStreaming({ isStreaming: false, partial: '', traces: [] });
    }, []);

    return {
        // Message state
        messages,
        isLoading,
        streaming,

        // Supabase sessions
        sessions,

        // Threads
        threads,
        activeThread,
        sessionTitle,
        sessionSummary,

        // Actions
        sendMessage,              // non-streaming (fallback)
        sendMessageStreaming,     // streaming (preferred)
        stopStream,
        createNewConversation,
        loadHistory,
        loadThreadHistory,        // load a memory thread by session_id
        endCurrentThread,         // end + consolidate current thread
        renameThread,
        loadMemorySessions,
        refreshMemorySessionMeta,
    };
}
