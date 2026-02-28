
'use client';

import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-[#16161a] border border-red-500/20 rounded-[32px] p-10 shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 text-3xl mx-auto mb-6">
                        ⚠️
                    </div>
                    <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Authentication Error</h1>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        The login handshake failed. This can happen if the link has expired or if there is a mismatch in your Supabase configuration.
                    </p>
                    <Link
                        href="/login"
                        className="block w-full py-4 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
