'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase/client';
import { Button } from '@/ui/components/ui/button';
import { Mail, Github, Chrome } from 'lucide-react';

export default function AuthPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50/50 p-4 font-sans">
            <div className="bg-white p-10 rounded-[32px] shadow-2xl w-full max-w-md border border-rose-100 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-rose-400 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-lg shadow-rose-200 rotate-3">H</div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Hanachan App</h1>
                    <p className="text-slate-500 font-medium mt-3 text-lg">Master Japanese with ease.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <Button
                        disabled={loading}
                        className="w-full py-7 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                        onClick={handleGoogleLogin}
                    >
                        <Chrome className="w-5 h-5" />
                        {loading ? 'Connecting...' : 'Continue with Google'}
                    </Button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-300 bg-white px-4">Or</div>
                    </div>

                    <Button
                        variant="outline"
                        disabled={loading}
                        className="w-full py-7 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                        onClick={() => router.push('/login/email')}
                    >
                        <Mail className="w-5 h-5" />
                        Sign in with Email
                    </Button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                        By continuing, you belong to the <br />
                        <span className="text-rose-400">Hanachan Learning Community</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}
