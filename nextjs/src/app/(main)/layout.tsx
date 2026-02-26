'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUser } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clsx } from 'clsx';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [userLevel, setUserLevel] = useState(1);

    const isSession = pathname.startsWith('/learn') || pathname.startsWith('/review');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            // Simple fetch for level to show in header or use as context
            supabase.from('users').select('level').eq('id', user.id).maybeSingle()
                .then(({ data }) => setUserLevel(data?.level || 1));
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 animate-pulse">Initializing hanachan</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getPageTitle = (path: string) => {
        const lastPart = path.split('/').pop() || '';
        if (!lastPart || lastPart === 'dashboard') return 'Overview';
        if (lastPart === 'learn') return 'Discovery Training';
        if (lastPart === 'review') return 'Review Session';
        if (lastPart === 'content') return 'Library';
        if (lastPart === 'chatbot') return 'Hanachan AI';

        try {
            const decoded = decodeURIComponent(lastPart);
            return decoded
                .replace(/^(vocab|kanji|radical|grammar)_/, '')
                .replace(/[_-]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } catch (e) {
            return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
        }
    };

    const pageTitle = getPageTitle(pathname);

    return (
        <div className="flex h-screen bg-[#FFFDFD] overflow-hidden font-sans relative">
            {!isSession && <Sidebar />}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Regular Header - Optimized for Density */}
                {!isSession && !pathname.includes('/chatbot') && (
                    <header className="h-14 border-b border-border bg-white/80 backdrop-blur-md flex items-center justify-between px-md md:px-lg shrink-0 z-30">
                        <div className="flex items-center gap-xs">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-sm shadow-primary/20" />
                            <h1 className="text-xl font-black text-foreground tracking-tight capitalize py-1">
                                {pageTitle}
                            </h1>
                        </div>
                        <div className="flex items-center gap-sm">
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Level {userLevel}</span>
                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                    {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'LEARNER'}
                                </span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-[10px] font-black text-primary shadow-sm uppercase">
                                {(user?.user_metadata?.display_name || user?.email || 'H')[0]}
                            </div>
                        </div>
                    </header>
                )}

                <main className={clsx(
                    "flex-1 overflow-auto custom-scrollbar relative",
                    isSession ? "z-50" : "p-sm lg:p-md bg-[#FFFDFD]"
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}

