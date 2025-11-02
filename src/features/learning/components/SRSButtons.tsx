"use client";

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SRSButtonsProps {
    onSelect: (level: string) => void;
    className?: string;
}

export function SRSButtons({ onSelect, className }: SRSButtonsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') onSelect('again');
            if (e.key === '2') onSelect('hard');
            if (e.key === '3') onSelect('good');
            if (e.key === '4') onSelect('easy');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSelect]);

    const buttons = [
        { id: 'again', label: 'Again', key: '1', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
        { id: 'hard', label: 'Hard', key: '2', color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
        { id: 'good', label: 'Good', key: '3', color: 'bg-sakura-accent-muted text-sakura-accent-primary border-sakura-divider hover:bg-sakura-bg-soft' },
        { id: 'easy', label: 'Easy', key: '4', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
    ];

    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 w-full", className)}>
            {buttons.map((btn) => (
                <button
                    key={btn.id}
                    onClick={() => onSelect(btn.id)}
                    className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95",
                        btn.color
                    )}
                >
                    <span className="text-base font-black tracking-tight mb-0.5">{btn.label}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{btn.key}</span>
                </button>
            ))}
        </div>
    );
}
