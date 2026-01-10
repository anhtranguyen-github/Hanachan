
'use client'

import { useActionState } from 'react'
import { signup } from '@/features/auth/actions'
import Link from 'next/link'
import { Loader2, MailCheck } from 'lucide-react'

const initialState = {
    error: '',
    success: false,
    message: ''
}

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(signup, initialState)

    if (state?.success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-50 font-sans">
                <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold">Check your email</h2>
                    <p className="text-zinc-400">
                        We have sent a confirmation link to your email address. Please click the link to activate your account.
                    </p>
                    <div className="mt-8">
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-50 font-sans selection:bg-indigo-500/30">

            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
                <div className="absolute bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Join thousands of language learners today
                    </p>
                </div>

                <form action={formAction} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        {state?.error && (
                            <div className="mb-4 text-center text-sm font-medium text-rose-500 bg-rose-500/10 p-2 rounded-md border border-rose-500/20">
                                {state.error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isPending ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-zinc-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
