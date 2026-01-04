
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;
    const isAuthPage = path.startsWith('/login')
    const isPublicPage = path === '/' || path.startsWith('/auth')

    console.log(`\x1b[35m[Auth Guard]\x1b[0m Path: ${path.padEnd(20)} | User: ${(user?.email || 'GUEST').padEnd(20)} | isAuth: ${isAuthPage} | isPublic: ${isPublicPage}`);

    if (!user && !isAuthPage && !isPublicPage) {
        console.log(`\x1b[31m[Auth Guard] ➔ REDIRECTING GUEST to /login\x1b[0m`);
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthPage) {
        console.log(`\x1b[32m[Auth Guard] ➔ REDIRECTING USER to /dashboard\x1b[0m`);
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}
