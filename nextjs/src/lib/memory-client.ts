/**
 * Memory API Client (browser-safe)
 *
 * Frontend code must not call Supabase/OpenAI directly.
 * All authenticated memory/session operations go through Next.js API routes (BFF).
 */

// ---------------------------------------------------------------------------
// Types (mirrors Python models)
// ---------------------------------------------------------------------------

export interface MemoryChatResponse {
    user_id: string;
    session_id: string | null;
    message: string;
    response: string;
    episodic_context: string;
    semantic_context: string;
    thread_context: string;
}

// Chat threads (conversation containers)
export interface MemorySession {
    session_id: string;
    user_id: string;
    title: string | null;
    summary: string | null;
    created_at: string;
    updated_at: string;
    message_count: number;
    metadata: Record<string, unknown>;
}

export interface MemorySessionFull extends MemorySession {
    messages: Array<{ role: string; content: string; timestamp?: string }>;
}

export interface EpisodicMemory {
    id: string;
    text: string;
    score?: number;
    created_at?: string;
}

export interface MemoryContextBlock {
    user_id: string;
    query: string;
    system_prompt_block: string;
    episodic_memories: EpisodicMemory[];
    semantic_facts: Record<string, unknown>[];
    user_profile_snippet: string;
    thread_history: Array<{ role: string; content: string; timestamp?: string }>;
}

export interface UserProfile {
    user_id: string;
    name: string | null;
    preferences: string[];
    goals: string[];
    interests: string[];
    facts: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function parseJsonOrThrow(res: Response) {
    const text = await res.text();
    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    const payload = isJson ? (text ? JSON.parse(text) : null) : text;
    if (!res.ok) {
        if (res.status === 401) {
            throw new Error('Unauthorized');
        }
        const msg =
            typeof payload === 'string'
                ? payload
                : (payload && typeof payload === 'object' && 'error' in payload)
                    ? String((payload as any).error)
                    : `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return payload;
}

async function getBrowserAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data: sessionData } = await supabase.auth.getSession();
        return sessionData?.session?.access_token ?? null;
    } catch {
        return null;
    }
}

// Backward-compatible alias types
export type ChatThread = MemorySession;
export type ChatThreadFull = MemorySessionFull;

/** 
 * Create a new conversation thread via Next.js BFF.
 */
export async function createMemorySession(
    _userId: string,
    _metadata?: Record<string, unknown>,
): Promise<string> {
    const token = await getBrowserAccessToken();
    if (!token) {
        // User not authenticated in browser; skip thread creation.
        throw new Error('Unauthorized');
    }

    const res = await fetch('/api/thread/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    const json = await parseJsonOrThrow(res);
    const sessionId = (json as any)?.session_id || (json as any)?.id || (json as any);
    if (!sessionId || typeof sessionId !== 'string') throw new Error('Invalid session response');
    return sessionId;
}

/** 
 * List user threads via Next.js BFF.
 */
export async function listMemorySessions(_userId: string): Promise<MemorySession[]> {
    const token = await getBrowserAccessToken();
    if (!token) {
        // Not logged in: no threads to show, and avoid 401 spam.
        return [];
    }
    const res = await fetch('/api/thread/sessions', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
    });
    const json = await parseJsonOrThrow(res);
    return Array.isArray(json) ? (json as MemorySession[]) : [];
}

/** 
 * Get thread details via Next.js BFF.
 */
export async function getMemorySession(
    sessionId: string,
): Promise<MemorySessionFull | null> {
    const token = await getBrowserAccessToken();
    if (!token) {
        return null;
    }
    const res = await fetch(`/api/thread/session/${encodeURIComponent(sessionId)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    const json = await parseJsonOrThrow(res);
    return json as MemorySessionFull;
}

/** 
 * Update thread metadata via Next.js BFF.
 */
export async function updateMemorySession(
    sessionId: string,
    updates: Partial<Pick<MemorySession, 'title' | 'summary'>>,
): Promise<void> {
    const token = await getBrowserAccessToken();
    if (!token) {
        throw new Error('Unauthorized');
    }

    const res = await fetch(`/api/thread/session/${encodeURIComponent(sessionId)}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: updates.title ?? null, summary: updates.summary ?? null }),
    });
    await parseJsonOrThrow(res);
}

/** 
 * Delete thread via Next.js BFF.
 */
export async function deleteMemorySession(sessionId: string): Promise<void> {
    const token = await getBrowserAccessToken();
    if (!token) {
        return;
    }
    const res = await fetch(`/api/thread/session/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    await parseJsonOrThrow(res);
}

// ---------------------------------------------------------------------------
// Episodic Memory (Stubbed - requires agent via Supabase)
// ---------------------------------------------------------------------------

/** 
 * Search episodic memories.
 * ⚠️ This functionality requires the FastAPI memory agent.
 * The agent should be triggered via Supabase, not called directly.
 * 
 * Stub implementation returns empty array.
 */
export async function searchEpisodicMemory(
    userId: string,
    query: string,
    k: number = 5,
): Promise<EpisodicMemory[]> {
    return [];
}

// ---------------------------------------------------------------------------
// User Profile (Stubbed - use Supabase directly)
// ---------------------------------------------------------------------------

/** 
 * Get user profile.
 * Use Supabase directly instead of calling FastAPI.
 * 
 * Stub implementation returns basic profile.
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
    return {
        user_id: userId,
        name: null,
        preferences: [],
        goals: [],
        interests: [],
        facts: [],
    };
}

/** 
 * Update user profile.
 * Use Supabase directly instead of calling FastAPI.
 */
export async function updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'user_id'>>,
): Promise<void> {
    void userId;
    void updates;
    throw new Error('User profile update is not available from the browser');
}

// ---------------------------------------------------------------------------
// Streaming Chat - Delegates to Next.js API route
// ---------------------------------------------------------------------------

/**
 * memoryChatStream - Streams chat response via Next.js API route
 * Previously called FastAPI directly - now uses Next.js API route
 */
export async function memoryChatStream(
    userId: string,
    message: string,
    sessionId?: string,
    ttsEnabled?: boolean,
): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch('/api/agent/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            message,
            session_id: sessionId,
            tts_enabled: ttsEnabled,
        }),
    });


    if (!res.ok || !res.body) {
        throw new Error('Failed to start chat stream');
    }

    return res.body;
}


// Alias for backward compatibility
export const streamMemoryChat = memoryChatStream;

/**
 * getMemoryContext - Returns memory context for chat
 * Stub implementation - full context should be fetched via API route
 */
export async function getMemoryContext(
    userId: string,
    query?: string,
    sessionId?: string,
    limit?: number,
): Promise<MemoryContextBlock> {
    console.warn('[memory-client] Memory context stubbed - using API route instead');

    // Return minimal context - actual implementation should call API route
    return {
        user_id: userId,
        query: query || '',
        system_prompt_block: '',
        episodic_memories: [],
        semantic_facts: [],
        user_profile_snippet: '',
        thread_history: [],
    };
}

/**
 * getMemoryContextBlock - Alias for getMemoryContext
 */
export const getMemoryContextBlock = getMemoryContext;

/**
 * End thread and return updated session data
 */
export async function endMemorySession(
    sessionId: string,
    _saveContext?: boolean
): Promise<{ title: string | null; summary: string | null }> {
    const token = await getBrowserAccessToken();
    if (!token) {
        return { title: null, summary: null };
    }
    const res = await fetch(`/api/thread/session/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    const json = await parseJsonOrThrow(res);
    return {
        title: (json as any)?.title ?? null,
        summary: (json as any)?.summary ?? null,
    };
}

// ---------------------------------------------------------------------------
// Default export for convenience
// ---------------------------------------------------------------------------

const memoryClient = {
    // Thread-oriented aliases (preferred)
    createThread: createMemorySession,
    listThreads: listMemorySessions,
    getThread: getMemorySession,
    updateThread: updateMemorySession,
    deleteThread: deleteMemorySession,
    // Legacy names (session/memory)
    createSession: createMemorySession,
    listSessions: listMemorySessions,
    getSession: getMemorySession,
    updateSession: updateMemorySession,
    deleteSession: deleteMemorySession,
    searchEpisodic: searchEpisodicMemory,
    getProfile: getUserProfile,
    updateProfile: updateUserProfile,
    streamChat: streamMemoryChat,
    getContextBlock: getMemoryContextBlock,
};

export default memoryClient;
