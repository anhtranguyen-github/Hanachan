'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // Read the 'next' parameter from the URL if it exists
        const queryParams = new URLSearchParams(window.location.search);
        const nextPath = queryParams.get('next') || '/dashboard';

        // Listen for the initial session setup
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Once signed in, redirect to intended target
                router.push(nextPath);
                router.refresh();
            } else if (event === 'SIGNED_OUT') {
                router.push('/login');
            }
        });

        // Fallback: Check session immediately in case event already fired
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push(nextPath);
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#F4ACB7] rounded-3xl blur-2xl opacity-20 animate-pulse" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#16161a] to-[#0a0a0c] border border-white/10 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                        花
                    </div>
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-white font-black text-xs uppercase tracking-[0.4em] animate-pulse">
                        Synchronizing Protocol
                    </p>
                    <div className="flex justify-center gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-1 h-1 bg-[#F4ACB7] rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
