'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUser } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const isSession = pathname.includes('/learn/session') || pathname.includes('/review/session');

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

    return (
        <div className="flex min-h-screen bg-white text-black h-screen overflow-hidden">
            {!isSession && <Sidebar />}
            <main className={`flex-1 overflow-auto ${isSession ? 'h-full' : 'p-8'}`}>
                {children}
            </main>
        </div>
    );
}

