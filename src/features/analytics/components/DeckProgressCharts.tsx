'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, BookOpen, BarChart3 } from 'lucide-react';

interface LevelProgress {
    level: string;
    current: number;
    total: number;
}

interface DeckProgressCardProps {
    deckName: string;
    totalCards: number;
    masteredCards: number;
    levelBreakdown?: LevelProgress[];
    className?: string;
}

/**
 * Deck Progress Card with expandable level breakdown
 * Shows JLPT-style level progress bars
 */
export function DeckProgressCard({
    deckName,
    totalCards,
    masteredCards,
    levelBreakdown = [],
    className
}: DeckProgressCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const progressPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

    return (
        <div className={cn("bg-white rounded-3xl border border-sakura-divider overflow-hidden", className)}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-6 hover:bg-sakura-bg-soft/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black text-sakura-text-primary">{deckName}</h3>
                        <p className="text-xs text-sakura-text-muted">
                            <span className="text-emerald-600 font-bold">{masteredCards}</span> / {totalCards} words
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-sakura-text-muted" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-sakura-text-muted" />
                )}
            </button>

            {/* Level Breakdown */}
            {isExpanded && levelBreakdown.length > 0 && (
                <div className="px-6 pb-6 space-y-4">
                    {levelBreakdown.map((level) => {
                        const pct = level.total > 0 ? Math.round((level.current / level.total) * 100) : 0;
                        return (
                            <div key={level.level}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-bold text-indigo-700">{level.level}</span>
                                    <span className="text-xs text-sakura-text-muted">
                                        {level.current}/{level.total} ({pct}%)
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {/* Practice Link */}
                    <div className="pt-2 text-right">
                        <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            Practice Vocabulary →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ActivityDataPoint {
    date: string;
    value: number;
    learned?: number;
}

interface ActivityGraphProps {
    title: string;
    subtitle?: string;
    data: ActivityDataPoint[];
    stats?: {
        totalFlips: number;
        avgFlipsPerDay: number;
        newKnownWords: number;
        avgWordsPerDay: number;
    };
    className?: string;
}

/**
 * Activity Graph with daily card flips visualization
 */
export function ActivityGraph({
    title,
    subtitle,
    data,
    stats,
    className
}: ActivityGraphProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className={cn("bg-white rounded-3xl border border-sakura-divider overflow-hidden", className)}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-6 hover:bg-sakura-bg-soft/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black text-sakura-text-primary">{title}</h3>
                        {subtitle && <p className="text-xs text-sakura-text-muted">{subtitle}</p>}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-sakura-text-muted" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-sakura-text-muted" />
                )}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6">
                    {/* Stats Row */}
                    {stats && (
                        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-sakura-text-muted">Total Flips</p>
                                <p className="text-2xl font-black text-sakura-text-primary">{stats.totalFlips}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-sakura-text-muted">Avg Flips/Day</p>
                                <p className="text-2xl font-black text-sakura-text-primary">{stats.avgFlipsPerDay}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-sakura-text-muted">New Known</p>
                                <p className="text-2xl font-black text-emerald-600">{stats.newKnownWords}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-sakura-text-muted">Avg Words/Day</p>
                                <p className="text-2xl font-black text-emerald-600">{stats.avgWordsPerDay}</p>
                            </div>
                        </div>
                    )}

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold text-sakura-text-muted">Card Flips</span>
                    </div>

                    {/* Chart */}
                    <div className="relative h-48">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-sakura-text-muted font-mono">
                            <span>{maxValue.toFixed(1)}</span>
                            <span>{(maxValue * 0.5).toFixed(1)}</span>
                            <span>0</span>
                        </div>

                        {/* Chart area */}
                        <div className="ml-10 h-full flex items-end gap-0.5 pb-6 overflow-x-auto">
                            {data.map((point, i) => {
                                const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
                                return (
                                    <div key={i} className="flex-1 min-w-[8px] flex flex-col items-center group">
                                        <div
                                            className="w-full max-w-3 bg-indigo-500 rounded-t transition-all group-hover:bg-indigo-600"
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                        />
                                        {/* X-axis label - show every 5th */}
                                        {i % 5 === 0 && (
                                            <span className="text-[8px] text-sakura-text-muted mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                                                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface GlobalDeckStatsProps {
    decks?: Array<{
        id: string;
        name: string;
        totalCards: number;
        masteredCards: number;
        dueCards: number;
    }>;
    totals?: {
        totalCards: number;
        masteredCards: number;
        dueCards: number;
        deckCount?: number;
    };
    className?: string;
}

/**
 * Global Deck Stats - Summary of all decks
 */
export function GlobalDeckStats({ decks = [], totals, className }: GlobalDeckStatsProps) {
    const totalCards = totals ? totals.totalCards : decks.reduce((sum, d) => sum + d.totalCards, 0);
    const totalMastered = totals ? totals.masteredCards : decks.reduce((sum, d) => sum + d.masteredCards, 0);
    const totalDue = totals ? totals.dueCards : decks.reduce((sum, d) => sum + d.dueCards, 0);
    const deckCount = totals?.deckCount ?? decks.length;
    const overallPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

    return (
        <div className={cn("bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white", className)}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-80">All Decks Progress</h3>
                    <p className="text-4xl font-black mt-1">{overallPct}%</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold opacity-80">{deckCount} categories</p>
                    <p className="text-sm font-bold opacity-80">{totalCards} items</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${overallPct}%` }}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/10 rounded-xl">
                    <p className="text-2xl font-black text-red-200">{totalMastered}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Mastered</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                    <p className="text-2xl font-black text-emerald-300">{totalCards - totalMastered}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Learning</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-xl">
                    <p className="text-2xl font-black text-amber-300">{totalDue}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Due Today</p>
                </div>
            </div>
        </div>
    );
}

interface SRSDistributionProps {
    data: {
        apprentice: number;
        guru: number;
        master: number;
        enlightened: number;
        burned: number;
    };
    className?: string;
}

/**
 * SRS Distribution Chart - Shows items by SRS stage (WaniKani style)
 */
export function SRSDistributionChart({ data, className }: SRSDistributionProps) {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const stages = [
        { label: 'Burned', value: data.burned, color: 'bg-red-500', textColor: 'text-red-600' },
        { label: 'Enlightened', value: data.enlightened, color: 'bg-amber-600', textColor: 'text-amber-600' },
        { label: 'Master', value: data.master, color: 'bg-amber-500', textColor: 'text-amber-500' },
        { label: 'Guru', value: data.guru, color: 'bg-amber-400', textColor: 'text-amber-400' },
        { label: 'Apprentice', value: data.apprentice, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    ];

    return (
        <div className={cn("bg-white rounded-3xl border border-sakura-divider p-6", className)}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-sakura-text-primary uppercase tracking-tighter text-sm">SRS Distribution</h3>
                <span className="text-[10px] font-black text-sakura-text-muted uppercase tracking-widest">{total} Total Items</span>
            </div>

            <div className="space-y-4">
                {stages.map((stage) => {
                    const pct = total > 0 ? Math.round((stage.value / total) * 100) : 0;
                    return (
                        <div key={stage.label}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", stage.textColor)}>{stage.label}</span>
                                <span className="text-[10px] font-black text-sakura-text-muted">{stage.value} ({pct}%)</span>
                            </div>
                            <div className="h-4 w-full bg-sakura-bg-soft rounded-full overflow-hidden border border-sakura-divider/50 p-0.5">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", stage.color)}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
