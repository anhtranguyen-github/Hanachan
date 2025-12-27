
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Hana-chan Supabase Client 
 * Hỗ trợ cả môi trường Next.js (SSR) và Standalone Scripts.
 */
/**
 * Admin Supabase Client
 * Bypasses RLS. Use ONLY in backend services/chat.
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export function createClient() {
    // 1. Check if we're in a Node/Server context and want to use Service Role (e.g. CLI/Scripts)
    const isNode = typeof window === 'undefined';
    const useServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.E2E === 'true' || !isNode);

    if (useServiceRole && !isNode) {
        return createAdminClient();
    }

    // 2. Nếu đang ở trong Next.js (Web), dùng SSR Client
    const { createServerClient } = require('@supabase/ssr');
    const { cookies } = require('next/headers');
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet: any) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }: any) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (err) { }
                },
            },
        }
    );
}
