import { ChevronRight } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { HelpTooltip, GlossaryKey, SRS_GLOSSARY } from './HelpTooltip';

/**
 * BarChartCard (Type F)
 * 
 * Features: Vertical bar chart with clickable bars + stage labels
 * Used for: ActiveSpreadCard
 */

export interface BarData {
    id: string | number;
    label: string;
    value: number;
    color?: string;
    helpKey?: GlossaryKey;
}

export interface BarChartCardProps {
    title: string;
    helpKey?: GlossaryKey;
    bars: BarData[];
    maxValue?: number;
    onBarClick?: (bar: BarData) => void;
    onDetailsClick?: () => void;
    showTotal?: boolean;
    className?: string;
    loading?: boolean;
}

export function BarChartCard({
    title,
    helpKey,
    bars,
    maxValue,
    onBarClick,
    onDetailsClick,
    showTotal = true,
    className,
    loading = false,
}: BarChartCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-32 bg-black/10" />
                    <div className="h-4 w-16 bg-black/10" />
                </div>
                <div className="flex items-end gap-2 h-32">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-black/5"
                            style={{ height: `${Math.random() * 60 + 20}%` }}
                        />
                    ))}
                </div>
            </Card>
        );
    }

    const calculatedMax = maxValue || Math.max(...bars.map(b => b.value), 1);
    const total = bars.reduce((sum, b) => sum + b.value, 0);

    return (
        <Card className={cn("border-black", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-black tracking-tight uppercase">{title}</h3>
                    {helpKey && (
                        <HelpTooltip content={SRS_GLOSSARY[helpKey]} />
                    )}
                </div>

                {onDetailsClick && (
                    <button
                        onClick={onDetailsClick}
                        className="flex items-center gap-1 text-[10px] font-black text-black hover:bg-black hover:text-white transition-all px-2 py-1 border border-black uppercase tracking-widest"
                    >
                        Details
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {/* Bar Chart */}
            <div className="relative h-36">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-black font-black pr-2">
                    <span>{calculatedMax}</span>
                    <span>{Math.round(calculatedMax / 2)}</span>
                    <span>0</span>
                </div>

                {/* Bars Container */}
                <div className="ml-8 h-full flex items-end gap-1.5 pb-6">
                    {bars.map((bar) => {
                        const height = (bar.value / calculatedMax) * 100;

                        return (
                            <div
                                key={bar.id}
                                className="flex-1 flex flex-col items-center group"
                            >
                                {/* Bar */}
                                <button
                                    onClick={() => onBarClick?.(bar)}
                                    className={cn(
                                        'w-full bg-black transition-all border border-black',
                                        bar.value > 0 ? 'min-h-[4px]' : 'min-h-0',
                                        onBarClick && 'hover:bg-white cursor-pointer'
                                    )}
                                    style={{ height: `${Math.max(height, bar.value > 0 ? 3 : 0)}%` }}
                                    title={`${bar.label}: ${bar.value}`}
                                />

                                {/* Label */}
                                <div className="flex items-center gap-0.5 mt-1">
                                    <span className="text-[10px] text-black font-black uppercase tracking-tighter">
                                        {bar.label}
                                    </span>
                                    {bar.helpKey && (
                                        <HelpTooltip
                                            content={SRS_GLOSSARY[bar.helpKey]}
                                            iconSize={10}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total */}
            {showTotal && (
                <div className="mt-2 pt-2 border-t border-black text-right flex justify-between items-center">
                    <span className="text-[10px] text-black font-black uppercase tracking-widest">Aggregate Score</span>
                    <span className="font-black text-black text-xl">{total}</span>
                </div>
            )}
        </Card>
    );
}

export default BarChartCard;
