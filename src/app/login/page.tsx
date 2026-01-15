
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { login } from '@/features/auth/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { Sparkles, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { clsx } from 'clsx';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="clay-btn w-full bg-primary py-4 text-xl disabled:opacity-50"
        >
            {pending ? 'Signing in...' : 'Sign In'}
            {!pending && <ArrowRight className="w-6 h-6" />}
        </button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useFormState(login as any, null);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-light/20 via-transparent to-transparent">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
                <div className="w-16 h-16 bg-primary rounded-clay border-4 border-primary-dark flex items-center justify-center text-white font-black text-3xl shadow-clay">
                    花
                </div>
                <div className="flex flex-col">
                    <h1 className="text-4xl font-black text-primary-dark tracking-tighter">HanaChan</h1>
                    <p className="text-primary-dark opacity-50 font-bold text-sm uppercase tracking-widest">Master Japanese</p>
                </div>
            </div>

            <div className="w-full max-w-md">
                <div className="clay-card p-8 bg-white overflow-visible">
                    <header className="mb-8">
                        <h2 className="text-2xl font-black text-primary-dark">Welcome back!</h2>
                        <p className="text-primary-dark/60 font-bold">Sign in to continue your journey.</p>
                    </header>

                    <form action={formAction} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black uppercase text-primary-dark/50 ml-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/30" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="clay-input pl-12 h-14"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-xs font-black uppercase text-primary-dark/50">Password</label>
                                <Link href="#" className="text-xs font-black text-primary hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/30" />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="clay-input pl-12 h-14"
                                    required
                                />
                            </div>
                        </div>

                        {state?.error && (
                            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-clay text-red-600 font-bold text-sm animate-shake">
                                {state.error}
                            </div>
                        )}

                        <SubmitButton />
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-primary-dark/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 font-black text-primary-dark/30">Or join with</span>
                        </div>
                    </div>

                    <button className="clay-btn bg-white !text-primary-dark w-full border-2 py-3 hover:bg-primary/5">
                        <Github className="w-5 h-5" />
                        Continue with Github
                    </button>
                </div>

                <p className="mt-8 text-center text-primary-dark/60 font-bold">
                    Don't have an account? {' '}
                    <Link href="/signup" className="text-primary hover:underline">Join HanaChan today</Link>
                </p>
            </div>

            {/* Floating Decorative Elements */}
            <div className="fixed bottom-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -z-10" />
            <div className="fixed top-20 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
        </div>
    );
}
