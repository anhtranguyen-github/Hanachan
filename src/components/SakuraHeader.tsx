'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { BRAND_COLORS } from '@/config/design.config';

interface SakuraHeaderProps {
    title: string;
    subtitle?: string;
    subtitleColor?: string; // Concept color for the pill
    actions?: React.ReactNode;
    filter?: React.ReactNode;
    showBackButton?: boolean;
}

/**
 * SAKURA SYSTEM V4: STANDARDIZED STICKY HEADER
 * Features:
 * - Desktop: 80-120px, solid background (No Blur)
 * - Mobile: 56-100px
 * - Dedicated Filter/Secondary Toolbar Row
 */
export function SakuraHeader({
    title,
    subtitle,
    subtitleColor = '#7C3AED', // Default to purple (AI/Analysis)
    actions,
    filter,
    showBackButton = false
}: SakuraHeaderProps) {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-sakura-divider">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
                {/* Primary Row: Title & Actions */}
                <div className="flex h-14 md:h-20 items-center justify-between gap-4">
                    {/* Left Section: Title & Subtitle */}
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        {showBackButton && (
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-sakura-cocoa/5 rounded-full transition-colors flex-shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-sakura-cocoa" />
                            </button>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-4 overflow-hidden">
                            <h1 className="text-xl md:text-3xl font-black tracking-tighter text-sakura-ink whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                                {title}
                            </h1>

                            {(subtitle || subtitleColor) && (
                                <div className="flex items-center h-full">
                                    <div className="hidden md:block w-px h-6 bg-sakura-divider" />
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider text-white md:ml-4"
                                        style={{ backgroundColor: subtitleColor }}
                                    >
                                        {subtitle || 'Section'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section: Actions */}
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        {actions}
                    </div>
                </div>

                {/* Secondary Row: Filter Bar */}
                {filter && (
                    <div className="pb-4 md:pb-6 flex items-center overflow-x-auto no-scrollbar">
                        {filter}
                    </div>
                )}
            </div>
        </header>
    );
}
