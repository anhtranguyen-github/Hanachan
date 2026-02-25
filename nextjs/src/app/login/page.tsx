'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
            } else {
                // AuthContext will detect the change and sync usage
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-black">
            {/* Logo */}
            <div className="flex flex-col items-center mb-12">
                <div className="text-6xl font-black border-4 border-black p-4 mb-4">花</div>
                <h1 className="text-4xl font-bold uppercase tracking-tighter underline decoration-4">HanaChan</h1>
                <p className="text-xs font-bold uppercase tracking-widest mt-2 grayscale">Advanced Japanese Language Interface</p>
            </div>

            <div className="w-full max-w-md">
                <div className="mn-card border-2">
                    <header className="mb-8 border-b border-black pb-4">
                        <h2 className="text-xl font-bold uppercase">Authentication</h2>
                        <p className="text-gray-500 text-sm italic">Identify yourself to access the learning core.</p>
                    </header>

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="USER@HANACHAN.APP"
                                className="mn-input w-full"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase">Password</label>
                                <Link href="#" className="text-[10px] uppercase underline">Recovery</Link>
                            </div>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="mn-input w-full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 border border-black text-sm font-bold uppercase">
                                ERROR: {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mn-btn mn-btn-primary w-full py-4 text-xl disabled:opacity-50"
                        >
                            {loading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-black"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white px-4 font-bold">Protocol Alternates</span>
                        </div>
                    </div>

                    <button className="mn-btn w-full border text-black hover:bg-black hover:text-white uppercase">
                        Link via Github
                    </button>
                </div>

                <div className="mt-8 text-center text-sm font-bold">
                    NEW APPLICANT? {' '}
                    <Link href="/signup" className="underline uppercase hover:bg-black hover:text-white px-2 py-1">Register Hub</Link>
                </div>
            </div>
        </div>
    );
}
