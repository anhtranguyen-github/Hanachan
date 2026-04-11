import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/chat'

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

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

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (!error && data.user) {
    const user = data.user
    const email = user.email || ''
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      email.split('@')[0]
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

    const { provisionUserProfile } = await import('@/features/auth/db')
    await provisionUserProfile(user.id, email, displayName, avatarUrl)

    return NextResponse.redirect(`${origin}${next}`)
  }

  console.error('[Auth Confirm] OTP verification error:', error)
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
