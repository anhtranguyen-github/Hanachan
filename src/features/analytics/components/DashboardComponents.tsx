'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MasterySphereProps {
    total: number;
    mastered: number;
    learning: number;
    review: number;
    className?: string;
}

/**
 * A beautiful radial progress indicator for the Dashboard.
 * Focuses on visual presentation of overall progress.
 */
export function MasterySphere({ total, mastered, learning, review, className }: MasterySphereProps) {
    const masteredPct = total > 0 ? (mastered / total) * 100 : 0;
    const learningPct = total > 0 ? (learning / total) * 100 : 0;
    const reviewPct = total > 0 ? (review / total) * 100 : 0;

    const size = 200;
    const stroke = 16;
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;

    // Offset calculation for layered rings
    const masteredOffset = circumference - (masteredPct / 100) * circumference;
    const learningOffset = circumference - ((masteredPct + learningPct) / 100) * circumference;
    const reviewOffset = circumference - ((masteredPct + learningPct + reviewPct) / 100) * circumference;

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    className="text-sakura-bg-soft"
                />

                {/* Review Ring (Outer) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#8B5CF6" // Purple
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={reviewOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out opacity-20"
                />

                {/* Learning Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#3B82F6" // Blue
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={learningOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                />

                {/* Mastered Ring (Top) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#EC4899" // Pink
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={masteredOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-[#EC4899]">{Math.round(masteredPct)}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted mt-1">Mastery</span>
            </div>
        </div>
    );
}

interface ActivityHeatmapProps {
    data: Array<{ date: string; value: number }>;
    className?: string;
}

/**
 * A GitHub-style activity grid for consistent daily tracking.
 */
export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
    // Show last 70 days (10 weeks)
    const weeks = 10;
    const totalDays = weeks * 7;
    const displayData = [...data].slice(-totalDays);

    // Fill up if data is shorter than display
    while (displayData.length < totalDays) {
        displayData.unshift({ date: '', value: 0 });
    }

    const getColor = (value: number) => {
        if (value === 0) return 'bg-sakura-bg-soft';
        if (value < 5) return 'bg-sakura-accent-primary/30';
        if (value < 15) return 'bg-sakura-accent-primary/60';
        return 'bg-sakura-accent-primary';
    };

    return (
        <div className={cn("p-4 bg-white rounded-3xl border border-sakura-divider", className)}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted">Activity Heatmap</h4>
                <div className="flex gap-1">
                    {[0, 1, 2, 3].map(v => (
                        <div key={v} className={cn("w-2 h-2 rounded-sm", getColor(v * 10))} />
                    ))}
                </div>
            </div>

            <div className="grid grid-flow-col grid-rows-7 gap-1">
                {displayData.map((day, i) => (
                    <div
                        key={i}
                        className={cn("w-3 h-3 rounded-sm transition-colors", getColor(day.value))}
                        title={day.date ? `${day.date}: ${day.value} reviews` : ''}
                    />
                ))}
            </div>
        </div>
    );
}

interface BentoCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    span?: '1' | '2' | '3';
}

export function BentoCard({ title, subtitle, children, className, span = '1' }: BentoCardProps) {
    const spanClass = {
        '1': 'lg:col-span-4',
        '2': 'lg:col-span-8',
        '3': 'lg:col-span-12'
    }[span];

    return (
        <div className={cn(
            "bg-white rounded-[2rem] border border-sakura-divider p-6 flex flex-col h-full overflow-hidden",
            spanClass,
            className
        )}>
            <div className="mb-4">
                <h3 className="text-sm font-black text-sakura-text-primary uppercase tracking-tighter">{title}</h3>
                {subtitle && <p className="text-[10px] text-sakura-text-muted font-bold uppercase tracking-widest">{subtitle}</p>}
            </div>
            <div className="flex-1 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
