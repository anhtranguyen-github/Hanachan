'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50/50 p-4">
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg border border-rose-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-rose-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">H</div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to Hanachan</h1>
                    <p className="text-slate-500 font-medium mt-2">The last Japanese learning tool you'll ever need.</p>
                </div>

                <div className="space-y-4">
                    <button
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        onClick={() => router.push('/dashboard')}
                    >
                        Continue with Google
                    </button>
                    <button
                        className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-rose-200 hover:bg-rose-50 transition-colors active:scale-95 text-center"
                        onClick={() => router.push('/dashboard')}
                    >
                        Continue with Email
                    </button>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                    By continuing, you agree to our Terms of Service.
                </div>
            </div>
        </div>
    );
}
