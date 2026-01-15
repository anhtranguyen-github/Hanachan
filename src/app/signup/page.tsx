
'use client';

import React from 'react';
import Link from 'next/link';
import { signup } from '@/features/auth/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="clay-btn w-full bg-secondary py-4 text-xl disabled:opacity-50"
        >
            {pending ? 'Creating account...' : 'Create Account'}
            {!pending && <ArrowRight className="w-6 h-6" />}
        </button>
    );
}

export default function SignupPage() {
    const [state, formAction] = useFormState(signup as any, null);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-secondary rounded-clay border-4 border-primary-dark flex items-center justify-center text-white font-black text-3xl shadow-clay mx-auto mb-4">
                        新
                    </div>
                    <h1 className="text-3xl font-black text-primary-dark">Start Learning</h1>
                    <p className="text-primary-dark/60 font-bold">Join thousands of students mastering Japanese.</p>
                </div>

                <div className="clay-card p-8 bg-white overflow-visible">
                    <form action={formAction} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black uppercase text-primary-dark/50 ml-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/30" />
                                <input
                                    name="fullName"
                                    type="text"
                                    placeholder="Hana Chan"
                                    className="clay-input pl-12 h-14"
                                    required
                                />
                            </div>
                        </div>

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
                            <label className="text-xs font-black uppercase text-primary-dark/50 ml-2">Password</label>
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

                        {state?.message && (
                            <div className={`p-4 rounded-clay font-bold text-sm ${state.success ? 'bg-green-50 border-2 border-green-500 text-green-600' : 'bg-red-50 border-2 border-red-500 text-red-600'}`}>
                                {state.message}
                            </div>
                        )}

                        <SubmitButton />
                    </form>
                </div>

                <p className="mt-8 text-center text-primary-dark/60 font-bold">
                    Already have an account? {' '}
                    <Link href="/login" className="text-primary hover:underline">Log in here</Link>
                </p>
            </div>
        </div>
    );
}
