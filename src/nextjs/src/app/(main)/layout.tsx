'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
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

    useEffect(() => {
        // Enforce guest access restrictions manually
        if (!loading && !user) {
            const protectedRoutes = ['/learn', '/dashboard', '/review', '/immersion', '/reading', '/videos', '/decks', '/sentences', '/profile', '/chat'];
            const isProtected = protectedRoutes.some(path => pathname.startsWith(path));

            if (isProtected) {
                router.replace('/');
            }
        }
    }, [user, loading, router, pathname]);

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
                </div>
            </div>
        );
    }

    // Special handling for the chat layout which needs to be flush and manage its own height
    const isChat = pathname.startsWith('/chat');

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans relative mesh-bg">
            {/* Global Top Header */}
            <Header />

            {/* Main Content Area */}
            <div className={clsx(
                "flex-1 flex flex-col overflow-hidden",
                isChat ? "min-h-0" : "relative"
            )}>
                <main className={clsx(
                    "flex-1 relative",
                    isChat ? "overflow-hidden min-h-0" : "overflow-auto custom-scrollbar p-4 lg:p-6"
                )}>
                    {children}
                </main>
                {!isChat && <HanaClock />}
            </div>
        </div>
    );
}
