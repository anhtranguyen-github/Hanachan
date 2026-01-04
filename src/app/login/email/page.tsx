
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup } from '@/features/auth/actions';
import { Button } from '@/ui/components/ui/button';
import { Input } from '@/ui/components/ui/input';
import { ChevronLeft } from 'lucide-react';

export default function EmailLoginPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const action = isSignUp ? signup : login;
        const result = await action(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50/50 p-4 font-sans">
            <div className="bg-white p-10 rounded-[32px] shadow-2xl w-full max-w-md border border-rose-100 animate-in slide-in-from-bottom-8 duration-500">
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold transition-colors text-sm"
                >
                    <ChevronLeft size={16} /> Back
                </button>

                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="text-slate-500 font-medium mt-2">{isSignUp ? 'Join the community today.' : 'Please enter your details.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                            <Input name="display_name" placeholder="Hana Chan" required className="rounded-2xl border-slate-100 py-6 px-5 focus:ring-rose-200" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                        <Input name="email" type="email" placeholder="name@example.com" required className="rounded-2xl border-slate-100 py-6 px-5 focus:ring-rose-200" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                        <Input name="password" type="password" placeholder="••••••••" required className="rounded-2xl border-slate-100 py-6 px-5 focus:ring-rose-200" />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-7 bg-rose-400 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 transition-all active:scale-[0.98] text-lg mt-4"
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
