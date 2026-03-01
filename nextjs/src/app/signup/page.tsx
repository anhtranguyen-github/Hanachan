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
                setMessage({ text: error.message, success: false });
            } else {
                setMessage({ text: 'Account created! Check your email for a confirmation link.', success: true });
            }
        } catch (err: any) {
            setMessage({ text: err.message || 'An unexpected error occurred', success: false });
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <ScreenLayout background="green">
            {/* Branding Layer - always visible at top */}
            <div className="flex flex-col items-center pt-4 sm:pt-0 mb-6 sm:mb-8 transition-all duration-700">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#B7E4C7] to-[#A2D2FF] rounded-2xl blur opacity-25"></div>
                    <div className="relative text-4xl sm:text-5xl font-black bg-[#16161a] border border-[#B7E4C733] p-4 sm:p-5 rounded-2xl text-white shadow-2xl">
                        新
                    </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-5 sm:mt-6 tracking-tight">
                    Create <span className="text-[#B7E4C7]">Account</span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mt-3 sm:mt-4">
                    Start learning Japanese
                </p>
            </div>

            {/* Auth Card Layer - centered in remaining space */}
            <div className="flex-1 flex flex-col items-center justify-start w-full">
                <div className="bg-[#16161aB3] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative w-full">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B7E4C733] to-transparent"></div>

                    <form onSubmit={handleSignup} className="space-y-5 sm:space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="your chosen name"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 sm:py-4 text-white placeholder:text-white/20 outline-none focus:border-[#B7E4C7] focus:ring-4 focus:ring-[#B7E4C710] transition-all duration-300"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="name@domain.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 sm:py-4 text-white placeholder:text-white/20 outline-none focus:border-[#B7E4C7] focus:ring-4 focus:ring-[#B7E4C710] transition-all duration-300"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider ml-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 sm:py-4 text-white placeholder:text-white/20 outline-none focus:border-[#B7E4C7] focus:ring-4 focus:ring-[#B7E4C710] transition-all duration-300"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${message.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${message.success ? 'bg-green-400' : 'bg-red-500'}`}></div>
                                <p className="text-[11px] font-bold uppercase leading-tight">{message.text}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn relative w-full py-4 sm:py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-[#1a2f23] transition-all duration-500 overflow-hidden active:scale-[0.98] disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#B7E4C7] to-[#A2D2FF] transition-all duration-500 group-hover/btn:scale-105"></div>
                            <span className="relative z-10">{loading ? 'Creating account...' : 'Create account'}</span>
                        </button>
                    </form>
                </div>

                <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-loose">
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
