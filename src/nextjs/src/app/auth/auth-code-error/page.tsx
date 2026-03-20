
'use client';

import Link from 'next/link';
import { ScreenLayout } from '@/components/layout/ScreenLayout';

export default function AuthCodeError() {
    return (
        <ScreenLayout background="pink">
            <div className="flex flex-col items-center w-full max-w-[400px]">
                <div className="bg-[#16161a] border border-red-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl w-full">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 text-2xl mx-auto mb-4">
                        ⚠️
                    </div>
                    <h1 className="text-xl font-black text-white mb-3 uppercase tracking-tight text-center">Authentication Error</h1>
                    <p className="text-gray-400 text-xs leading-relaxed mb-6 text-center">
                        The login handshake failed. This can happen if the link has expired or if there is a mismatch in your Supabase configuration.
                    </p>
                    <Link
                        href="/login"
                        className="block w-full py-3 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all text-center"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </ScreenLayout>
    );
}
