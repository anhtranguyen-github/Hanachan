'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, success: boolean } | null>(null);

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
                setMessage({ text: 'Enrollment successful. Verification protocol initiated.', success: true });
                // Note: AuthProvider will detect the session if email confirmation is off, 
                // or the user will need to confirm email first.
            }
        } catch (err: any) {
            setMessage({ text: err.message || 'An unexpected error occurred', success: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-black">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="text-6xl font-black border-4 border-black p-4 mb-4 inline-block">新</div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Registration</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">Enrollment into the Semantic Core</p>
                </div>

                <div className="mn-card border-2 shadow-none">
                    <form onSubmit={handleSignup} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase">Candidate Name</label>
                            <input
                                name="fullName"
                                type="text"
                                placeholder="YOUR FULL NAME"
                                className="mn-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase">Digital Address</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="NAME@DOMAIN.COM"
                                className="mn-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase">Access Secret</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="mn-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {message && (
                            <div className={`p-4 border font-bold text-sm uppercase ${message.success ? 'border-green-500 text-green-600' : 'border-black text-black'}`}>
                                STATUS: {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mn-btn mn-btn-primary w-full py-4 text-xl disabled:opacity-50"
                        >
                            {loading ? 'INITIALIZING...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-sm font-bold">
                    PREVIOUS ENROLLMENT? {' '}
                    <Link href="/login" className="underline uppercase hover:bg-black hover:text-white px-2 py-1">Return to Login</Link>
                </div>
            </div>
        </div>
    );
}
