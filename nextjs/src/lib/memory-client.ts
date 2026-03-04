/**
 * Memory API Client
 * 
 * ⚠️ ARCHITECTURE VIOLATION WARNING ⚠️
 * 
 * This module previously called FastAPI directly, which violates the architecture rule:
 * - FastAPI = Agents ONLY (stateless, no auth)
 * - Next.js = Business Logic Owner (BFF pattern)
 * - Supabase = Single Source of Truth
 * 
 * As part of Phase 2 migration, direct FastAPI calls have been disabled.
 * The functions below now return mock data or throw descriptive errors.
 * 
 * Migration Path:
 * 1. Memory operations should use Supabase client directly
 * 2. Or call Next.js API routes that manage the business logic
 * 3. FastAPI memory agents are triggered via Supabase changes
 * 
 * See: documentation/ARCHITECTURE_RULES.md
 */

import { supabase } from "@/lib/supabase";

const MEMORY_API_BASE = process.env.MEMORY_API_URL ?? 'http://localhost:8765/api/v1';

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
// Architecture Violation Error
// ---------------------------------------------------------------------------

class ArchitectureViolationError extends Error {
    constructor(feature: string) {
        super(
            `Architecture Violation: ${feature} cannot call FastAPI directly. ` +
            `FastAPI = Agents ONLY. Use Supabase client or Next.js API routes. ` +
            `See documentation/ARCHITECTURE_RULES.md`
        );
        this.name = 'ArchitectureViolationError';
    }
}

// ---------------------------------------------------------------------------
// Stubbed Functions (Phase 2 Migration)
// These functions previously called FastAPI - now they use Supabase or return stubs
// ---------------------------------------------------------------------------

/** 
 * Create a new conversation thread via Supabase.
 * Previously called FastAPI - now uses Supabase directly.
 */
export async function createMemorySession(
    userId: string,
    metadata?: Record<string, unknown>,
): Promise<string> {
    console.warn('[memory-client] Using Supabase for session creation (was FastAPI)');

    const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
            user_id: userId,
            metadata: metadata || {},
        })
        .select('id')
        .single();

    if (error) {
        console.error('[memory-client] Error creating session:', error);
        throw new Error('Failed to create chat session');
    }

    return data.id;
}

/** 
 * List user sessions from Supabase.
 * Previously called FastAPI - now uses Supabase directly.
 */
export async function listMemorySessions(userId: string): Promise<MemorySession[]> {
    console.warn('[memory-client] Using Supabase for session list (was FastAPI)');

    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('[memory-client] Error listing sessions:', error);
        return [];
    }

    return (data || []).map(session => ({
        session_id: session.id,
        user_id: session.user_id,
        title: session.title,
        summary: session.summary,
        created_at: session.created_at,
        updated_at: session.updated_at,
        message_count: session.message_count || 0,
        metadata: session.metadata || {},
    }));
}

/** 
 * Get session details from Supabase.
 * Previously called FastAPI - now uses Supabase directly.
 */
export async function getMemorySession(
    sessionId: string,
): Promise<MemorySessionFull | null> {
    console.warn('[memory-client] Using Supabase for session details (was FastAPI)');

    const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        console.error('[memory-client] Error fetching session:', sessionError);
        return null;
    }

    const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (messagesError) {
        console.error('[memory-client] Error fetching messages:', messagesError);
    }

    return {
        session_id: session.id,
        user_id: session.user_id,
        title: session.title,
        summary: session.summary,
        created_at: session.created_at,
        updated_at: session.updated_at,
        message_count: session.message_count || 0,
        metadata: session.metadata || {},
        messages: (messages || []).map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.created_at,
        })),
    };
}

/** 
 * Update session metadata in Supabase.
 * Previously called FastAPI - now uses Supabase directly.
 */
export async function updateMemorySession(
    sessionId: string,
    updates: Partial<Pick<MemorySession, 'title' | 'summary' | 'metadata'>>,
): Promise<void> {
    console.warn('[memory-client] Using Supabase for session update (was FastAPI)');

    const { error } = await supabase
        .from('chat_sessions')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

    if (error) {
        console.error('[memory-client] Error updating session:', error);
        throw new Error('Failed to update session');
    }
}

/** 
 * Delete session from Supabase.
 * Previously called FastAPI - now uses Supabase directly.
 */
export async function deleteMemorySession(sessionId: string): Promise<void> {
    console.warn('[memory-client] Using Supabase for session delete (was FastAPI)');

    const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error('[memory-client] Error deleting session:', error);
        throw new Error('Failed to delete session');
    }
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
    console.warn('[memory-client] Episodic memory search stubbed - agent should be triggered via Supabase');
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
    console.warn('[memory-client] Using Supabase for user profile (was FastAPI)');

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('[memory-client] Error fetching user profile:', error);
        return {
            user_id: userId,
            name: null,
            preferences: [],
            goals: [],
            interests: [],
            facts: [],
        };
    }

    return {
        user_id: userId,
        name: data.display_name,
        preferences: data.preferences || [],
        goals: data.goals || [],
        interests: data.interests || [],
        facts: data.facts || [],
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
    console.warn('[memory-client] Using Supabase for profile update (was FastAPI)');

    const { error } = await supabase
        .from('users')
        .update({
            display_name: updates.name,
            preferences: updates.preferences,
            goals: updates.goals,
            interests: updates.interests,
            facts: updates.facts,
        })
        .eq('id', userId);

    if (error) {
        console.error('[memory-client] Error updating profile:', error);
        throw new Error('Failed to update profile');
    }
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
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer ? MEMORY_API_BASE : '';
    const url = isServer ? `${baseUrl}/chat/stream` : '/api/chat/stream';

    const res = await fetch(url, {
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
 * End memory session and return updated session data
 */
export async function endMemorySession(
    sessionId: string,
    _saveContext?: boolean
): Promise<{ title: string | null; summary: string | null }> {
    console.warn('[memory-client] Using Supabase for end session (was FastAPI)');

    // First get current session data
    const { data: session, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('title, summary')
        .eq('id', sessionId)
        .single();

    if (fetchError) {
        console.error('[memory-client] Error fetching session:', fetchError);
    }

    // Update ended_at
    const { error } = await supabase
        .from('chat_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

    if (error) {
        console.error('[memory-client] Error ending session:', error);
        throw new Error('Failed to end session');
    }

    return {
        title: session?.title ?? null,
        summary: session?.summary ?? null,
    };
}

// ---------------------------------------------------------------------------
// Default export for convenience
// ---------------------------------------------------------------------------

export default {
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
