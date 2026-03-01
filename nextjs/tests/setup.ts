
import dotenv from 'dotenv';
import path from 'path';
import { vi } from 'vitest';

// Load .env if it exists (local dev). In CI, env vars are injected directly.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set safe defaults for unit tests that don't need real credentials
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.OPENAI_API_KEY ??= 'sk-test-key';
process.env.MEMORY_API_URL ??= 'http://localhost:8765';

// ── Test utilities ─────────────────────────────────────────────────────────

/**
 * Create a mock for a Supabase response
 */
export function createMockSupabaseResponse<T>(data: T, error: Error | null = null) {
    return {
        data,
        error,
        status: error ? 400 : 200,
        statusText: error ? 'Bad Request' : 'OK',
    };
}

/**
 * Create a mock Supabase client with common methods
 */
export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
    return {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    then: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                order: vi.fn().mockReturnValue({
                    then: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({ data: [], error: null }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
        ...overrides,
    };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock session object
 */
export function createMockSession(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: createMockUser(),
        ...overrides,
    };
}

/**
 * Wait for a specified time (useful for testing async operations)
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock function that rejects after a timeout
 */
export function createMockTimedOutFn<T>(timeoutMs: number = 5000): () => Promise<T> {
    return async () => {
        await delay(timeoutMs);
        throw new Error('Operation timed out');
    };
}
