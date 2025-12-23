
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

interface HanaContextType {
    theme: 'sakura' | 'night';
}

const HanaContext = createContext<HanaContextType | undefined>(undefined);

export function HanaProvider({ children }: { children: ReactNode }) {
    const theme = useUIStore((state) => state.activeTheme);

    return (
        <HanaContext.Provider value={{ theme }}>
            <div className={cn(
                "hana-root min-h-screen transition-colors duration-500",
                theme === 'night' ? "bg-sakura-ink text-white" : "bg-sakura-bg-app text-sakura-ink"
            )}>
                {children}
            </div>
        </HanaContext.Provider>
    );
}

export const useHana = () => {
    const context = useContext(HanaContext);
    if (!context) throw new Error('useHana must be used within a HanaProvider');
    return context;
};
