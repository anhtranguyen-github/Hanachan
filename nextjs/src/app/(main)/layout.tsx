'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUser } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clsx } from 'clsx';
import { HanaClock } from '@/components/shared/HanaClock';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [userLevel, setUserLevel] = useState(1);

    const isSession = pathname.startsWith('/learn/session') || pathname.startsWith('/review/session');
    const isChatbot = pathname.includes('/chatbot') || pathname.includes('/speaking');

    useEffect(() => {
        // No longer redirecting to login - guests can view public content
        // Auth-required actions will show a modal instead
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            supabase.from('users').select('level').eq('id', user.id).maybeSingle()
                .then(({ data }) => setUserLevel(data?.level || 1));
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-30 animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary/30 animate-scale-in">
                            花
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Allow guests to view content - no redirect to login anymore
    // Auth-required features will show a modal instead

    const getPageTitle = (path: string) => {
        const lastPart = path.split('/').pop() || '';
        if (!lastPart || lastPart === 'dashboard') return 'Overview';
        if (lastPart === 'learn') return 'Discovery Training';
        if (lastPart === 'review') return 'Review Session';
        if (lastPart === 'content') return 'Library';
        if (lastPart === 'chatbot') return 'Hanachan AI';
        if (lastPart === 'speaking') return 'Speaking Practice';
        if (lastPart === 'progress') return 'Progress';
        if (lastPart === 'profile') return 'Profile';
        if (lastPart === 'videos') return 'Video Library';
        try {
            return decodeURIComponent(lastPart)
                .replace(/^(vocab|kanji|radical|grammar)_/, '')
                .replace(/[_-]/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        } catch {
            return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
        }
    };

    const pageTitle = getPageTitle(pathname);
    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="flex h-screen overflow-hidden font-sans relative mesh-bg">
            {/* Desktop sidebar - hidden on mobile */}
            {!isSession && <Sidebar />}

            <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
                {/* Desktop header - hidden on mobile (mobile uses Sidebar's top bar) */}
                {!isSession && !isChatbot && (
                    <header className="hidden lg:flex h-14 border-b border-border/40 bg-white/70 backdrop-blur-xl items-center justify-between px-md shrink-0 z-30 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-40" />
                            </div>
                            <h1 className="text-[17px] font-black text-[#3E4A61] tracking-tight capitalize">
                                {pageTitle}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FFF5F7] border border-primary/20 rounded-xl">
                                <div className="w-1 h-1 bg-primary rounded-full" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Level {userLevel}</span>
                            </div>
                            <div className="flex items-center gap-2.5 group cursor-pointer">
                                <div className="flex flex-col items-end leading-none">
                                    <span className="text-[11px] font-black text-[#3E4A61] uppercase tracking-tight">{displayName}</span>
                                    <span className="text-[8px] font-bold text-[#CBD5E0] uppercase tracking-[0.15em] mt-0.5">Active</span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary rounded-xl blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-[10px] font-black text-white shadow-sm shadow-primary/20">
                                        {initials}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                <main className={clsx(
                    "flex-1 overflow-auto custom-scrollbar relative",
                    isSession
                        ? "z-50"
                        : isChatbot
                            ? "p-0"
                            : "p-3 lg:p-4 pt-3 lg:pt-4",
                    // Mobile: add top padding for fixed header, bottom padding for bottom nav
                    !isSession && "pt-[calc(3.5rem+0.75rem)] lg:pt-3 pb-[calc(4rem+0.75rem)] lg:pb-3"
                )}>
                    {children}
                </main>
                <HanaClock />
            </div>
        </div>
    );
}
