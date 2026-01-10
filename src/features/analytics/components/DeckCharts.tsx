'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getStageName, type ItemState } from '@/types/srs';
import { LEARNING_STATES } from '@/config/design.config';

interface DeckStatsChartProps {
    stats: {
        total_cards: number;
        new_cards: number;
        learning_cards: number;
        review_cards: number;
        mastered_cards: number;
        due_cards: number;
    };
    className?: string;
}

/**
 * Deck Statistics Chart
 * Displays a visual breakdown of card states in a deck.
 */
export function DeckStatsChart({ stats, className }: DeckStatsChartProps) {
    const { total_cards, new_cards, learning_cards, review_cards, mastered_cards, due_cards } = stats;

    // Calculate percentages
    const segments = [
        { label: 'Mastered', value: mastered_cards, color: LEARNING_STATES.mastered.shellColor, pct: (mastered_cards / total_cards) * 100 },
        { label: 'Review', value: review_cards, color: LEARNING_STATES.review.shellColor, pct: (review_cards / total_cards) * 100 },
        { label: 'Learning', value: learning_cards, color: LEARNING_STATES.learning.shellColor, pct: (learning_cards / total_cards) * 100 },
        { label: 'New', value: new_cards, color: LEARNING_STATES.new.shellColor, pct: (new_cards / total_cards) * 100 },
    ].filter(s => s.value > 0);

    const completionPct = total_cards > 0 ? Math.round(((mastered_cards + review_cards) / total_cards) * 100) : 0;

    return (
        <div className={cn("bg-white rounded-3xl border border-sakura-divider p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-sakura-text-muted">Deck Progress</h3>
                    <p className="text-4xl font-black text-sakura-text-primary mt-1">{completionPct}%</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-sakura-text-muted font-bold">{total_cards} total cards</p>
                    {due_cards > 0 && (
                        <p className="text-sm font-black text-orange-500 mt-1">{due_cards} due today</p>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex">
                {segments.map((seg, i) => (
                    <div
                        key={seg.label}
                        className="h-full transition-all duration-500"
                        style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {segments.map(seg => (
                    <div key={seg.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted">{seg.label}</p>
                            <p className="text-sm font-black text-sakura-text-primary">{seg.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface ReviewForecastProps {
    forecast: Array<{ date: string; count: number }>;
    className?: string;
}

/**
 * Review Forecast Chart
 * Shows predicted reviews for the next 7 days.
 */
export function ReviewForecastChart({ forecast, className }: ReviewForecastProps) {
    const maxCount = Math.max(...forecast.map(f => f.count), 1);

    const getDayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tmrw';
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
        <div className={cn("bg-white rounded-3xl border border-sakura-divider p-6", className)}>
            <h3 className="text-xs font-black uppercase tracking-widest text-sakura-text-muted mb-4">
                Review Forecast (7 days)
            </h3>

            <div className="flex items-end justify-between gap-2 h-32">
                {forecast.map((day, i) => {
                    const height = (day.count / maxCount) * 100;
                    const isToday = i === 0;

                    return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex-1 w-full flex items-end justify-center">
                                <div
                                    className={cn(
                                        "w-full max-w-8 rounded-t-lg transition-all duration-300",
                                        isToday ? "bg-gradient-to-t from-orange-500 to-amber-400" : "bg-gradient-to-t from-cyan-500 to-cyan-400"
                                    )}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                />
                            </div>
                            <div className="text-center">
                                <p className={cn(
                                    "text-sm font-black",
                                    isToday && day.count > 0 ? "text-orange-500" : "text-sakura-text-primary"
                                )}>
                                    {day.count}
                                </p>
                                <p className="text-[10px] font-bold text-sakura-text-muted">{getDayLabel(day.date)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface CardStatusBadgeProps {
    state: ItemState;
    stage: number;
    dueDate?: string | null;
    interval?: number;
    className?: string;
}

/**
 * Card Status Badge
 * Shows the current SRS state of a card.
 */
export function CardStatusBadge({ state, stage, dueDate, interval, className }: CardStatusBadgeProps) {
    const config = {
        NEW: { label: 'New', color: 'bg-slate-100 text-slate-600' },
        APPRENTICE: { label: 'Apprentice', color: 'bg-pink-100 text-pink-700' },
        GURU: { label: 'Guru', color: 'bg-purple-100 text-purple-700' },
        MASTER: { label: 'Master', color: 'bg-indigo-100 text-indigo-700' },
        ENLIGHTENED: { label: 'Enlightened', color: 'bg-blue-100 text-blue-700' },
        BURNED: { label: 'Burned', color: 'bg-slate-200 text-slate-700' },
    }[state];

    const isDue = dueDate && new Date(dueDate) <= new Date();

    // Format interval
    const intervalLabel = interval
        ? interval < 1
            ? `${Math.round(interval * 24 * 60)}m`
            : interval < 30
                ? `${Math.round(interval)}d`
                : `${Math.round(interval / 30)}mo`
        : null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white",
                isDue && "ring-2 ring-orange-400 ring-offset-1"
            )} style={{ backgroundColor: LEARNING_STATES[state.toLowerCase() as keyof typeof LEARNING_STATES]?.shellColor || '#94a3b8' }}>
                {isDue ? 'Due' : getStageName(stage)}
            </span>
            {intervalLabel && state.toLowerCase() !== 'new' && (
                <span className="text-[10px] text-sakura-text-muted font-mono">
                    {intervalLabel}
                </span>
            )}
        </div>
    );
}

interface MiniProgressBarProps {
    interval: number;
    maxInterval?: number;
    className?: string;
}

/**
 * Mini Progress Bar
 * Shows a tiny progress indicator for card mastery level.
 */
export function MiniProgressBar({ interval, maxInterval = 120, className }: MiniProgressBarProps) {
    const progress = Math.min((interval / maxInterval) * 100, 100);

    const getColor = () => {
        if (progress < 10) return 'bg-slate-300';
        if (progress < 30) return 'bg-amber-400';
        if (progress < 60) return 'bg-cyan-400';
        return 'bg-emerald-400';
    };

    return (
        <div className={cn("h-1 w-16 rounded-full bg-slate-100 overflow-hidden", className)}>
            <div
                className={cn("h-full rounded-full transition-all duration-300", getColor())}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
