import { cookies } from 'next/headers';

export async function getBearerFromSupabaseCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const allCookies = typeof cookieStore.getAll === 'function' ? cookieStore.getAll() : [];

    // Supabase auth cookie is typically `sb-<project-ref>-auth-token`.
    for (const cookie of allCookies) {
        if (!cookie.name.includes('-auth-token')) continue;
        try {
            let raw = cookie.value;
            if (raw.startsWith('base64-')) {
                raw = Buffer.from(raw.slice(7), 'base64').toString('utf8');
            }

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed) && parsed[0]) return `Bearer ${parsed[0]}`;

            if (parsed && typeof parsed === 'object' && 'access_token' in parsed) {
                const token = (parsed as any).access_token;
                if (typeof token === 'string' && token) return `Bearer ${token}`;
            }
        } catch {
            // ignore malformed cookie values
        }
    }
    return null;
}
