'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ScreenLayout } from '@/components/layout/ScreenLayout';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, success: boolean } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: fullName,
                    },
                },
            });

            if (error) {
                setMessage({ text: (error instanceof Error ? error.message : String(error)), success: false });
            } else {
                setMessage({ text: 'Account created! Check your email for a confirmation link.', success: true });
            }
        } catch (err: unknown) {
            setMessage({ text: (err instanceof Error ? err.message : String(err)) || 'An unexpected error occurred', success: false });
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <ScreenLayout background="green">
            {/* Branding Layer - compact */}
            <div className="flex flex-col items-center mb-3 sm:mb-4">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#B7E4C7] to-[#A2D2FF] rounded-xl blur opacity-25"></div>
                    <div className="relative text-2xl sm:text-3xl font-black bg-[#16161a] border border-[#B7E4C733] p-3 rounded-xl text-white shadow-2xl">
                        新
                    </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-3 tracking-tight">
                    Create <span className="text-[#B7E4C7]">Account</span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">
                    Start learning Japanese
                </p>
            </div>

            {/* Auth Card Layer - compact */}
            <div className="flex flex-col items-center w-full">
                <div className="bg-[#16161aB3] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative w-full">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B7E4C733] to-transparent"></div>

                    <form onSubmit={handleSignup} className="space-y-3">
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="your chosen name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 outline-none focus:border-[#B7E4C7] focus:ring-2 focus:ring-[#B7E4C710] transition-all duration-300 text-sm"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 outline-none focus:border-[#B7E4C7] focus:ring-2 focus:ring-[#B7E4C710] transition-all duration-300 text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 outline-none focus:border-[#B7E4C7] focus:ring-2 focus:ring-[#B7E4C710] transition-all duration-300 text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-xl border flex items-center gap-2 ${message.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${message.success ? 'bg-green-400' : 'bg-red-500'}`}></div>
                                <p className="text-[10px] font-bold uppercase leading-tight">{message.text}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn relative w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-[#1a2f23] transition-all duration-500 overflow-hidden active:scale-[0.98] disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#B7E4C7] to-[#A2D2FF] transition-all duration-500 group-hover/btn:scale-105"></div>
                            <span className="relative z-10">{loading ? 'Creating account...' : 'Create account'}</span>
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                        Already have an account? {' '}
                        <Link href="/login" className="text-white hover:text-[#B7E4C7] underline decoration-[#B7E4C7]/30 hover:decoration-[#B7E4C7] transition-all ml-1">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </ScreenLayout>
    );
}
