'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                // If Supabase is down or error, we might want a fallback for testing
                // But as per user request: "seed an account then use it"
                setError(signInError.message);
                setLoading(false);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#0a0a0c]">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F4ACB74D] blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#CDB4DB33] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#A2D2FF22] blur-[100px] rounded-full"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-[440px]">
                {/* Branding */}
                <div className="flex flex-col items-center mb-10 transition-all duration-700 transform translate-y-0 opacity-100">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative text-5xl font-black bg-[#16161a] border border-[#F4ACB733] p-5 rounded-2xl text-white shadow-2xl">
                            花
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mt-6 tracking-tight">
                        HanaChan <span className="text-[#F4ACB7]">V2</span>
                    </h1>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#F4ACB7] to-transparent mt-2"></div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium mt-4">
                        Advanced Language Synthesis Core
                    </p>
                </div>

                {/* Glass Card */}
                <div className="bg-[#16161aB3] backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl overflow-hidden relative group">
                    {/* Inner edge light */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider ml-1">Digital Identity</label>
                                <div className="relative group/input">
                                    <input
                                        type="email"
                                        placeholder="user@hanachan.app"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-[#F4ACB7] focus:ring-4 focus:ring-[#F4ACB710] transition-all duration-300"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-[#F4ACB705] opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity"></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Access Protocol</label>
                                    <Link href="#" className="text-[10px] text-[#F4ACB7] uppercase font-bold hover:underline transition-all">Forgot?</Link>
                                </div>
                                <div className="relative group/input">
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-[#F4ACB7] focus:ring-4 focus:ring-[#F4ACB710] transition-all duration-300"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-[#F4ACB705] opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity"></div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <p className="text-[11px] text-red-500 font-bold uppercase leading-none">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group/btn relative w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-[#592E38] transition-all duration-500 overflow-hidden active:scale-[0.98] disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] transition-all duration-500 group-hover/btn:scale-105"></div>
                            <span className="relative z-10">{loading ? 'Processing...' : 'Authorize Session'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                setLoading(true);
                                // The system expects "user@hanachan.app" / "password123" to exist per earlier seeds
                                const testEmail = "user@hanachan.app";
                                const testPass = "password123";
                                const { error: loginErr } = await supabase.auth.signInWithPassword({
                                    email: testEmail, password: testPass
                                });
                                if (loginErr) {
                                    // If test user doesn't exist, try creating it automatically for auto-login
                                    const { error: signUpErr } = await supabase.auth.signUp({
                                        email: testEmail, password: testPass,
                                        options: { data: { display_name: 'Auto User', level: 1 } }
                                    });
                                    if (!signUpErr) {
                                        router.push('/dashboard');
                                    } else {
                                        setError(signUpErr.message);
                                        setLoading(false);
                                    }
                                } else {
                                    router.push('/dashboard');
                                }
                            }}
                            disabled={loading}
                            className="w-full py-4 border-2 border-dashed border-[#F4ACB7]/30 hover:border-[#F4ACB7] rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#F4ACB7]/70 hover:text-[#F4ACB7] transition-all bg-[#F4ACB7]/5 hover:bg-[#F4ACB7]/10"
                        >
                            Developer Auto-Login
                        </button>
                    </form>

                    <div className="mt-8 flex flex-col items-center gap-4">
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Third-Party Verification</p>
                        <div className="flex gap-4 w-full">
                            <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group/social">
                                <svg className="w-5 h-5 text-white/50 group-hover/social:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                            </button>
                            <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group/social">
                                <svg className="w-5 h-5 text-white/50 group-hover/social:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.228 1.216-3.144 2.568-6.752 2.568-5.408 0-9.712-4.392-9.712-9.8s4.304-9.8 9.712-9.8c2.936 0 5.12 1.152 6.712 2.656l2.312-2.304c-1.984-1.896-4.592-3.392-9.024-3.392-7.856 0-14.192 6.336-14.192 14.192s6.336 14.192 14.192 14.192c4.232 0 7.44-1.392 9.944-4.008 2.592-2.592 3.4-6.216 3.4-9.28 0-.584-.048-1.128-.144-1.664h-13.2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center transition-all duration-700 delay-300 opacity-100">
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-loose">
                        Initial Enrollment? {' '}
                        <Link href="/signup" className="text-white hover:text-[#F4ACB7] underline decoration-[#F4ACB7]/30 hover:decoration-[#F4ACB7] transition-all ml-1">
                            Register Core
                        </Link>
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}
