
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessageAction, getSessionHistoryAction, createSessionAction, getUserSessionsAction } from '../actions';
import { ChatMessage, ChatSession } from '../types';
import {
    createMemorySession,
    endMemorySession,
    listMemorySessions,
    getMemorySession,
    updateMemorySession,
    type ChatThread,
    type ChatThreadFull,
} from '@/lib/memory-client';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamingState {
    isStreaming: boolean;
    partial: string;
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
        const [threads, setThreads] = useState<ChatThread[]>([]);
        const [activeThread, setActiveThread] = useState<ChatThreadFull | null>(null);
    const [streaming, setStreaming] = useState<StreamingState>({ isStreaming: false, partial: '' });
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
        try {
            const data = await listMemorySessions(userId);
            setThreads(data);
        } catch {
            // Memory API may be offline
        }
    }, [userId]);

    useEffect(() => { loadMemorySessions(); }, [loadMemorySessions]);

    /** Load or create the chat thread paired to this Supabase conversation. */
    const ensureMemorySession = useCallback(async (): Promise<string | null> => {
        if (!userId) return null;
        if (memorySessionIdRef.current) return memorySessionIdRef.current;
        try {
            const sid = await createMemorySession(userId, {
                supabase_session_id: conversationId ?? null,
            });
            memorySessionIdRef.current = sid;
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
            const data = await getMemorySession(sid);
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
        try {
            const data = await getMemorySession(memSessionId);
            // Merge memory messages into the local messages state
            const mapped: ChatMessage[] = data.messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: m.timestamp ?? new Date().toISOString(),
            }));
            setMessages(mapped);
            setSessionTitle(data.title ?? null);
            setSessionSummary(data.summary ?? null);
            setActiveThread(data);
            memorySessionIdRef.current = memSessionId;
        } catch {
            // fall back to Supabase history
            if (conversationId) await loadHistory(conversationId);
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
        setStreaming({ isStreaming: true, partial: '' });

        // Cancel any previous stream
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            const res = await fetch('/api/agent/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    message: content,
                    userId,
                    sessionId: memSessionId,
                    ttsEnabled,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (res.status === 401) {
                openLoginModal();
                throw new Error('Unauthorized');
            }
            if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

            const reader = res.body.getReader();
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
                        } else if (event.type === 'done') {
                            // Commit the full streaming response as a real message
                            setMessages(prev => [
                                ...prev,
                                {
                                    role: 'assistant',
                                    content: fullResponse,
                                    timestamp: new Date().toISOString(),
                                },
                            ]);
                            setStreaming({ isStreaming: false, partial: '' });

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
            setStreaming({ isStreaming: false, partial: '' });
        }
    }, [userId, ensureMemorySession, refreshMemorySessionMeta, loadMemorySessions, openLoginModal]);

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
            const result = await endMemorySession(sid, true);
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
            await updateMemorySession(sid, { title });
            setSessionTitle(title);
            await loadMemorySessions();
        } catch {
            // ignore
        }
    }, [loadMemorySessions]);

    // Stop the current stream
    const stopStream = useCallback(() => {
        abortControllerRef.current?.abort();
        setStreaming({ isStreaming: false, partial: '' });
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
