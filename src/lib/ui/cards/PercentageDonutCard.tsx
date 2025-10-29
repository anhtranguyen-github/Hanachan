import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { HelpTooltip, GlossaryKey, SRS_GLOSSARY } from './HelpTooltip';

/**
 * PercentageDonutCard (Type D)
 * 
 * Features: Donut chart + percentage + period + comparison
 * Used for: AccuracyCard, JLPTReadinessCard
 */

export interface PercentageDonutCardProps {
    title: string;
    helpKey?: GlossaryKey;
    percentage: number;
    label?: string;
    sublabel?: string;
    comparison?: {
        label: string;
        value: string | number;
        trend?: 'up' | 'down' | 'neutral';
    };
    breakdown?: Array<{
        label: string;
        value: number;
        color?: string;
    }>;
    illustration?: React.ReactNode;
    donutColor?: string;
    donutBgColor?: string;
    className?: string;
    loading?: boolean;
    expanded?: boolean;
    onToggleExpand?: () => void;
}

export function PercentageDonutCard({
    title,
    helpKey,
    percentage,
    label,
    sublabel,
    comparison,
    breakdown,
    illustration,
    donutColor = 'stroke-black',
    donutBgColor = 'stroke-black/10',
    className,
    loading = false,
    expanded = false,
    onToggleExpand,
}: PercentageDonutCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border border-black bg-black/5" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-24 bg-black/10" />
                        <div className="h-10 w-20 bg-black/10" />
                    </div>
                </div>
            </Card>
        );
    }

    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <Card
            className={cn(onToggleExpand && 'cursor-pointer hover:bg-neutral-50', 'border-black transition-all duration-300', className)}
            onClick={onToggleExpand}
        >
            <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                        {/* Background circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            strokeWidth="6"
                            className="stroke-black/5"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            strokeWidth="6"
                            className="stroke-black"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset,
                                transition: 'stroke-dashoffset 0.8s ease-out',
                            }}
                        />
                    </svg>
                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {illustration || (
                            <span className="text-[10px] font-black text-black">
                                {percentage.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-black tracking-tight uppercase text-sm">{title}</h3>
                        {helpKey && (
                            <HelpTooltip content={SRS_GLOSSARY[helpKey]} />
                        )}
                    </div>

                    <div className="text-4xl font-black text-black tracking-tighter mt-1">
                        {percentage.toFixed(1)}%
                    </div>

                    {label && (
                        <div className="text-[10px] font-black text-black mt-1 uppercase tracking-widest">{label}</div>
                    )}
                    {sublabel && (
                        <div className="text-[10px] font-black text-black uppercase tracking-tight">{sublabel}</div>
                    )}
                </div>
            </div>

            {/* Comparison */}
            {comparison && (
                <div className="mt-6 pt-4 border-t border-black text-[10px] font-black uppercase tracking-tighter flex justify-between items-center">
                    <span className="text-black">{comparison.label}</span>
                    <span className="font-black text-black text-lg">
                        {comparison.value}
                    </span>
                </div>
            )}

            {/* Breakdown (expanded) */}
            {expanded && breakdown && breakdown.length > 0 && (
                <div className="mt-6 pt-4 border-t border-black space-y-4">
                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-4">
                        Analysis Breakdown
                    </h4>
                    {breakdown.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span className="text-black">{item.label}</span>
                                    <span className="text-black">{item.value}%</span>
                                </div>
                                <div className="h-3 bg-white border border-black overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-black transition-all duration-1000"
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

export default PercentageDonutCard;
