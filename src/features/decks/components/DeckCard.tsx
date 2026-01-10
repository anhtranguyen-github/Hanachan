'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, BookOpen, CheckCircle, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeckCardProps {
    id: string;
    slug?: string | null;
    name: string;
    description?: string;
    itemCount?: number;
    masteredCount?: number;
    learningCount?: number;
    reviewCount?: number;
    dueCount?: number;
    isBookmarked?: boolean;
    onToggleBookmark?: (id: string) => void;
    className?: string;
    compact?: boolean;
}

export function DeckCard({
    id,
    slug,
    name,
    description,
    itemCount = 0,
    masteredCount = 0,
    learningCount = 0,
    reviewCount = 0,
    dueCount = 0,
    isBookmarked,
    onToggleBookmark,
    className,
    compact = false
}: DeckCardProps) {
    const isLevelDeck = name.startsWith("Level ");
    const levelNumber = isLevelDeck ? name.replace("Level ", "") : "";
    const identifier = slug || id;

    // mastery progress calculation
    const masteryPct = itemCount > 0 ? (masteredCount / itemCount) * 100 : 0;
    const learningPct = itemCount > 0 ? (learningCount / itemCount) * 100 : 0;

    return (
        <div
            className={cn(
                "group relative bg-white rounded-[2rem] border border-sakura-divider p-5 hover:border-sakura-cocoa/30 transition-all duration-300 flex flex-col justify-between shadow-none",
                compact ? "h-auto" : "h-full",
                className
            )}
        >
            {/* Header: Level/Name + Bookmark */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors",
                        dueCount > 0
                            ? "bg-sakura-cocoa text-white"
                            : "bg-sakura-bg-app text-sakura-cocoa/40 group-hover:bg-sakura-cocoa/10 group-hover:text-sakura-cocoa"
                    )}>
                        {isLevelDeck ? levelNumber : <BookOpen size={16} />}
                    </div>
                    <div>
                        <h3 className="text-base font-black text-sakura-ink leading-tight line-clamp-1">{name}</h3>
                        <p className="text-[10px] text-sakura-cocoa/40 font-black uppercase tracking-widest">{itemCount} ITEMS</p>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleBookmark?.(id);
                    }}
                    className={cn(
                        "p-2 rounded-lg transition-all active:scale-90",
                        isBookmarked ? "text-amber-600 bg-amber-50 border border-amber-100" : "text-sakura-cocoa/20 hover:text-sakura-cocoa"
                    )}
                >
                    <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                </button>
            </div>

            {!compact && (
                <p className="text-xs text-sakura-ink/60 font-medium line-clamp-2 mb-4 leading-relaxed">
                    {description || "Core content for this level."}
                </p>
            )}

            {/* Visual Progress Bar (Multi-segment) */}
            <div className="mb-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5 h-3">
                    <span className="text-sakura-text-muted">{masteredCount} Mastered</span>
                    {dueCount > 0 && <span className="text-sakura-cocoa font-black">{dueCount} Sync</span>}
                </div>
                <div className="h-2 w-full bg-sakura-bg-app rounded-full overflow-hidden flex border border-sakura-divider">
                    <div
                        className="h-full bg-[#64748b] transition-all duration-1000"
                        style={{ width: `${masteryPct}%` }}
                    />
                    <div
                        className="h-full bg-[#fbbf24] transition-all duration-1000 opacity-80"
                        style={{ width: `${learningPct}%` }}
                    />
                </div>
            </div>

            {/* Actions Simplified */}
            <div className="flex items-center gap-2">
                <Link
                    href={`/decks/${identifier}/study`}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                        dueCount > 0
                            ? "bg-sakura-cocoa text-white shadow-lg shadow-sakura-cocoa/20"
                            : "bg-sakura-bg-app text-sakura-cocoa/60 border border-sakura-divider hover:bg-white"
                    )}
                >
                    {dueCount > 0 ? `${dueCount} Sync` : "Begin"}
                    <ArrowRight size={12} />
                </Link>
                <Link
                    href={`/decks/${identifier}`}
                    className="p-2.5 bg-white border border-sakura-divider text-sakura-cocoa/40 hover:text-sakura-ink rounded-xl transition-all"
                >
                    <BookOpen size={14} />
                </Link>
            </div>
        </div>
    );
}
