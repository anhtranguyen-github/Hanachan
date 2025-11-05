"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SakuraSidebar } from './SakuraSidebar';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';

import { WordDetailModal } from '@/ui/components/shared/WordDetailModal';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const { isExpanded } = useSidebar();
    const pathname = usePathname();

    const isFullWidthPage = pathname === '/chat' || pathname === '/analyzer' || pathname === '/immersion';
    const isLandingPage = pathname === '/landing' || pathname === '/';
    const isFocusMode = pathname?.includes('/reviews') || pathname?.includes('/mock-test');
    const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/login';

    if (isLandingPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Sidebar (Conditional) */}
            {!isFocusMode && !isAuthPage && <SakuraSidebar />}

            <div
                className={cn(
                    "flex flex-col flex-1 transition-all duration-300 ease-in-out",
                    (isFocusMode || isAuthPage) ? "pl-0" : (isExpanded ? "pl-60" : "pl-16")
                )}
            >
                <main className="flex-1 flex flex-col">
                    <div className={cn(
                        "w-full flex-1 flex flex-col",
                        !isFullWidthPage && "max-w-7xl mx-auto px-4 md:px-8 pb-8"
                    )}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Global Word Modal */}
            <WordDetailModal />
        </div>
    );
}
