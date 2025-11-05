"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useDashboardStats } from '@/features/learning/hooks/useSrsData';

export type SidebarState = 'collapsed' | 'expanded';

interface SidebarContextType {
    state: SidebarState;
    isExpanded: boolean;
    isCollapsed: boolean;
    isOnChat: boolean;
    currentPath: string;
    toggle: () => void;
    expand: () => void;
    collapse: () => void;
    activeTab: 'app' | 'tools';
    setActiveTab: (tab: 'app' | 'tools') => void;
    studyStats: {
        reviewsCount: number;
        lessonsCount: number;
    };
    refreshStats: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<SidebarState>('expanded');
    const pathname = usePathname();

    const isOnChat = pathname === '/chat';

    const toggle = useCallback(() => setState(prev => prev === 'expanded' ? 'collapsed' : 'expanded'), []);
    const expand = useCallback(() => setState('expanded'), []);
    const collapse = useCallback(() => setState('collapsed'), []);

    const [activeTab, setActiveTab] = useState<'app' | 'tools'>('app');
    const { stats: studyStats, refresh: refreshStats } = useDashboardStats();

    const value = useMemo(() => ({
        state,
        isExpanded: state === 'expanded',
        isCollapsed: state === 'collapsed',
        isOnChat,
        currentPath: pathname,
        toggle,
        expand,
        collapse,
        activeTab,
        setActiveTab,
        studyStats,
        refreshStats
    }), [
        state,
        isOnChat,
        pathname,
        toggle,
        expand,
        collapse,
        activeTab,
        setActiveTab,
        studyStats,
        refreshStats
    ]);

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}
