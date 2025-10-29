'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, BookOpen, RotateCw, Flame, CheckCircle2 } from 'lucide-react';

export type ContentStatus = 'locked' | 'lessons' | 'reviews' | 'burned';

interface StatusLegendProps {
    activeStatus: ContentStatus | null;
    onStatusClick: (status: ContentStatus | null) => void;
    counts?: Record<ContentStatus, number>;
}

export function StatusLegend({ activeStatus, onStatusClick, counts }: StatusLegendProps) {
    const items: { id: ContentStatus; label: string; icon: React.ReactNode; color: string }[] = [
        { id: 'locked', label: 'Locked', icon: <Lock size={14} />, color: 'text-sakura-text-muted' },
        { id: 'lessons', label: 'In Lessons', icon: <BookOpen size={14} />, color: 'text-sakura-accent-primary' },
        { id: 'reviews', label: 'In Reviews', icon: <RotateCw size={14} />, color: 'text-blue-500' },
        { id: 'burned', label: 'Burned', icon: <Flame size={14} />, color: 'text-orange-500' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-2">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onStatusClick(activeStatus === item.id ? null : item.id)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold uppercase tracking-wide",
                        activeStatus === item.id
                            ? "bg-sakura-bg-soft border-sakura-accent-primary/40 scale-105"
                            : "bg-transparent border-transparent hover:bg-sakura-bg-soft/50 text-sakura-text-muted hover:text-sakura-text-primary"
                    )}
                >
                    <span className={cn(
                        "flex items-center justify-center p-1 rounded-md bg-white border border-sakura-divider",
                        item.color
                    )}>
                        {item.icon}
                    </span>
                    <span className={cn(
                        activeStatus === item.id ? "text-sakura-text-primary" : "text-sakura-text-muted"
                    )}>
                        {item.label}
                    </span>
                    {counts && counts[item.id] > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-sakura-bg-muted rounded-full text-[9px] text-sakura-text-secondary">
                            {counts[item.id]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
