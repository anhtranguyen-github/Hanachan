'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUser } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
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

    const isSession = pathname.startsWith('/learn/session') || pathname.startsWith('/review/session');
    const isChatbot = pathname.includes('/chatbot') || pathname.includes('/speaking');

    useEffect(() => {
        // No longer redirecting to login - guests can view public content
        // Auth-required actions will show a modal instead
    }, [user, loading, router]);

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

    return (
        <div className="flex h-screen overflow-hidden font-sans relative mesh-bg">
            {/* Desktop sidebar - hidden on mobile */}
            {!isSession && <Sidebar />}

            <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">

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
