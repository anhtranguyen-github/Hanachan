
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect address
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.user) {
            const user = data.user;
            const email = user.email || '';
            const displayName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.user_metadata?.name || email.split('@')[0];
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

            // Provision the user profile in public.users to avoid FK errors
            const { provisionUserProfile } = await import('@/features/auth/db');
            await provisionUserProfile(user.id, email, displayName, avatarUrl);

            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error('[Auth Callback] Session exchange error:', error)
        }
    } else {
        console.error('[Auth Callback] No code provided in URL')
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

export async function POST(request: Request) {
    // If we get a POST, redirect to GET with the same parameters
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/auth/callback`, { status: 303 })
}
