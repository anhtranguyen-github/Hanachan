'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUser } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const isSession = pathname.startsWith('/learn') || pathname.startsWith('/review');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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

    const pageTitle = pathname.split('/').pop()?.replace('-', ' ') || 'Overview';

    return (
        <div className="flex h-screen bg-[#FFFDFD] overflow-hidden font-sans relative">
            {!isSession && <Sidebar />}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Regular Header (Only shown when not overlay/session) */}
                {!isSession && !pathname.includes('/chatbot') && (
                    <header className="h-20 border-b border-[#F0E0E0] bg-white/80 backdrop-blur-md flex items-center justify-between px-12 shrink-0 z-30">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 bg-[#FFB5B5] rounded-full animate-pulse" />
                            <h2 className="text-2xl font-black text-[#3E4A61] tracking-tighter capitalize">
                                {pageTitle}
                            </h2>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Level {user?.level || 1}</span>
                                <span className="text-[11px] font-black text-[#3E4A61] uppercase tracking-tighter">
                                    {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'LEARNER'}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFDADA] flex items-center justify-center text-[12px] font-black text-[#FFB5B5] shadow-sm">
                                {(user?.user_metadata?.display_name || user?.email || 'H')[0].toUpperCase()}
                            </div>
                        </div>
                    </header>
                )}

                <main className={clsx(
                    "flex-1 overflow-auto custom-scrollbar relative",
                    isSession ? "z-50" : "p-8 lg:p-12 bg-[#FFFDFD]"
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}

