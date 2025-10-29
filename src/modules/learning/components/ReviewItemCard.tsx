"use client";

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Volume2 } from 'lucide-react';

interface ReviewItem {
    id: string;
    type: 'KANJI' | 'VOCABULARY' | 'GRAMMAR' | 'RADICAL' | string;
    text: string;
    meaning: string;
    reading?: string;
    example?: string;
    examples?: string[];
    pattern?: string;
    explanation?: string;
}

interface ReviewItemCardProps {
    item: ReviewItem;
    isRevealed: boolean;
    onReveal: () => void;
    className?: string;
}

export function ReviewItemCard({ item, isRevealed, onReveal, className }: ReviewItemCardProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isRevealed) {
                e.preventDefault();
                onReveal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRevealed, onReveal]);

    return (
        <div
            onClick={!isRevealed ? onReveal : undefined}
            className={cn(
                "w-full bg-sakura-bg-surface border-2 border-sakura-divider rounded-[2rem] p-6 text-center transition-all duration-500 relative overflow-hidden",
                !isRevealed && "cursor-pointer hover:border-sakura-accent-primary",
                className
            )}
        >
            <div className="relative z-10 flex flex-col items-center space-y-4">
                {/* Type Label */}
                <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    item.type === 'KANJI' ? "bg-sakura-accent-primary text-white" : "bg-sakura-bg-muted text-sakura-text-muted"
                )}>
                    {item.type}
                </span>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className={cn(
                        "font-black text-sakura-text-primary tracking-tighter leading-none font-jp transition-all duration-700",
                        isRevealed ? "text-4xl md:text-5xl" : "text-6xl md:text-8xl"
                    )}>
                        {item.text}
                    </div>
                </div>

                {/* Reveal Content */}
                {isRevealed && (
                    <div className="w-full max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="space-y-1">
                            {item.reading && (
                                <p className="text-xl font-black text-sakura-text-primary">{item.reading}</p>
                            )}
                            <p className="text-sm font-bold text-sakura-text-secondary">{item.meaning}</p>
                        </div>

                        {item.type === 'VOCABULARY' && (
                            <button className="p-2 rounded-full bg-sakura-bg-muted text-sakura-accent-primary hover:bg-sakura-bg-soft transition-colors border border-sakura-divider">
                                <Volume2 size={16} />
                            </button>
                        )}

                        <div className="pt-4 border-t border-sakura-divider/50 text-left space-y-2">
                            {item.example && (
                                <div className="p-3 bg-sakura-bg-soft rounded-xl border border-sakura-divider">
                                    <p className="text-sm font-bold text-sakura-text-primary">{item.example}</p>
                                </div>
                            )}
                            {item.pattern && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted mb-2">Pattern</h4>
                                    <p className="text-sm font-bold text-sakura-text-primary">{item.pattern}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Background Decorative Element */}
            <div className="absolute inset-0 bg-sakura-bg-soft opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
        </div >
    );
}
