/**
 * Memory API Client
 * Thin TypeScript wrapper around the FastAPI memory service at services/memory_api.
 * Import this wherever you need persistent memory in the Next.js app.
 */

const MEMORY_API_BASE = process.env.MEMORY_API_URL ?? 'http://localhost:8765';
const MEMORY_API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function memFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (MEMORY_API_KEY) {
        headers['Authorization'] = `Bearer ${MEMORY_API_KEY}`;
    }

    const res = await fetch(`${MEMORY_API_BASE}${path}`, {
        ...options,
        headers,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Memory API ${path} failed [${res.status}]: ${text}`);
    }
    return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/** Create a new conversation thread. Returns session_id. */
export async function createMemorySession(
    userId: string,
    metadata?: Record<string, unknown>,
): Promise<string> {
    const data = await memFetch<{ session_id: string }>('/memory/session', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, metadata }),
    });
    return data.session_id;
}

/** Get full session including messages, title, and rolling summary. */
export async function getMemorySession(sessionId: string): Promise<MemorySessionFull> {
    return memFetch<MemorySessionFull>(`/memory/session/${sessionId}`);
}

/** List all active sessions for a user (lightweight, no messages). */
export async function listMemorySessions(userId: string): Promise<MemorySession[]> {
    return memFetch<MemorySession[]>(`/memory/sessions/${userId}`);
}

/** Update a session's title or metadata. */
export async function updateMemorySession(
    sessionId: string,
    update: { title?: string; metadata?: Record<string, unknown> },
): Promise<MemorySessionFull> {
    return memFetch<MemorySessionFull>(`/memory/session/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
    });
}

/** End a session (optionally consolidate transcript into long-term memory). */
export async function endMemorySession(
    sessionId: string,
    consolidate = true,
): Promise<{ message: string; title: string | null; summary: string | null }> {
    return memFetch(`/memory/session/${sessionId}?consolidate=${consolidate}`, {
        method: 'DELETE',
    });
}

// ---------------------------------------------------------------------------
// Chat (non-streaming)
// ---------------------------------------------------------------------------

/** Full memory-augmented chat — goes through LangGraph agent. */
export async function memoryChat(
    userId: string,
    message: string,
    sessionId?: string,
): Promise<MemoryChatResponse> {
    return memFetch<MemoryChatResponse>('/memory/chat', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, message, session_id: sessionId ?? null }),
    });
}

// ---------------------------------------------------------------------------
// Chat (streaming) — returns a raw ReadableStream of SSE data
// ---------------------------------------------------------------------------

/**
 * Streaming memory chat. Yields SSE events from the memory API.
 *
 * Usage (in a Next.js streaming route):
 *   const stream = await memoryChatStream(userId, message, sessionId);
 *   return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
 */
export async function memoryChatStream(
    userId: string,
    message: string,
    sessionId?: string,
): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(`${MEMORY_API_BASE}/memory/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message, session_id: sessionId ?? null }),
    });
    if (!res.ok || !res.body) {
        throw new Error(`Memory stream failed [${res.status}]`);
    }
    return res.body;
}

// ---------------------------------------------------------------------------
// Context injection (for building system prompts)
// ---------------------------------------------------------------------------

/**
 * Fetch a ready-to-use memory context block for a user + query.
 * Use `result.system_prompt_block` as a prefix to your system message.
 */
export async function getMemoryContext(
    userId: string,
    query: string,
    sessionId?: string,
    maxEpisodic = 3,
): Promise<MemoryContextBlock> {
    return memFetch<MemoryContextBlock>('/memory/context', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            query,
            session_id: sessionId ?? null,
            max_episodic: maxEpisodic,
        }),
    });
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export async function getUserMemoryProfile(userId: string): Promise<UserProfile> {
    return memFetch<UserProfile>(`/memory/profile/${userId}`);
}

// ---------------------------------------------------------------------------
// Episodic memory
// ---------------------------------------------------------------------------

export async function searchEpisodicMemory(
    userId: string,
    query: string,
    k = 5,
): Promise<{ results: EpisodicMemory[] }> {
    return memFetch('/memory/episodic/search', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, query, k }),
    });
}

/** Delete a specific episodic memory ("right to forget"). */
export async function forgetEpisodicMemory(
    userId: string,
    memoryId: string,
): Promise<{ message: string }> {
    return memFetch(`/memory/episodic/${memoryId}?user_id=${userId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

/** Consolidate old episodic memories to reduce bloat. */
export async function consolidateMemory(userId: string) {
    return memFetch(`/memory/consolidate/${userId}`, { method: 'POST' });
}

/** Delete ALL memory for a user (episodic, semantic, sessions). */
export async function clearAllMemory(userId: string) {
    return memFetch(`/memory/clear/${userId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function checkMemoryHealth() {
    return memFetch<{ status: string; qdrant: string; neo4j: string }>('/health');
}
