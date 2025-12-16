
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Hana-chan Supabase Client 
 * Hỗ trợ cả môi trường Next.js (SSR) và Standalone Scripts.
 */
export function createClient() {
    // 1. Kiểm tra xem có đang ở trong môi trường Script/Node không
    // Nếu có SERVICE_ROLE_KEY và không có môi trường Request của Next.js
    const isNode = typeof window === 'undefined';
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Thử dùng cách an toàn để kiểm tra Next.js Headers
    let isNextContext = false;
    try {
        const { cookies } = require('next/headers');
        cookies();
        isNextContext = true;
    } catch (e) {
        isNextContext = false;
    }

    if (!isNextContext && hasServiceKey) {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
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
