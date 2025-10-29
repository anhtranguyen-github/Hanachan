'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GridPattern } from './ui/patterns/PremiumPatterns';

interface ContentToolbarProps {
    children?: React.ReactNode;
    className?: string;
    sticky?: boolean;
}

export function ContentToolbar({ children, className, sticky = false }: ContentToolbarProps) {
    return (
        <div className={cn(
            "w-full bg-transparent z-30 transition-all duration-300",
            sticky && "sticky top-0", // SakuraHeader is removed, so sticky to the very top
            className
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {children}
            </div>
        </div>
    );
}
