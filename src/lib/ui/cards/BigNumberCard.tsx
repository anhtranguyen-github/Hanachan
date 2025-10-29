import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { HelpTooltip, GlossaryKey, SRS_GLOSSARY } from './HelpTooltip';

/**
 * BigNumberCard (Type C)
 * 
 * Features: Illustration + large number + label + comparison stat
 * Used for: ReviewsCompletedCard, UpcomingUnlocksCard
 */

export interface BigNumberCardProps {
    title?: string;
    helpKey?: GlossaryKey;
    illustration?: React.ReactNode;
    illustrationBg?: string;
    value: number | string;
    label: string;
    sublabel?: string;
    comparison?: {
        label: string;
        value: string | number;
        trend?: 'up' | 'down' | 'neutral';
    };
    preview?: React.ReactNode; // e.g., preview of upcoming items
    className?: string;
    loading?: boolean;
}

export function BigNumberCard({
    title,
    helpKey,
    illustration,
    illustrationBg = 'bg-white border-black',
    value,
    label,
    sublabel,
    comparison,
    preview,
    className,
    loading = false,
}: BigNumberCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse text-center border-black', className)}>
                <div className="h-5 w-24 bg-black/10 mx-auto mb-4" />
                <div className={cn('w-16 h-16 mx-auto border-black mb-4', illustrationBg)} />
                <div className="h-12 w-20 mx-auto bg-black/10 mb-2" />
                <div className="h-4 w-32 mx-auto bg-black/10" />
            </Card>
        );
    }

    return (
        <Card className={cn('text-center border-black', className)}>
            {/* Header */}
            {title && (
                <div className="flex items-center justify-center gap-2 mb-4">
                    <h3 className="font-black text-black tracking-tight text-xs uppercase">
                        {title}
                    </h3>
                    {helpKey && (
                        <HelpTooltip content={SRS_GLOSSARY[helpKey]} />
                    )}
                </div>
            )}

            {/* Illustration */}
            {illustration && (
                <div className={cn(
                    'w-16 h-16 mx-auto border border-black flex items-center justify-center mb-6 overflow-hidden',
                    illustrationBg
                )}>
                    {illustration}
                </div>
            )}

            {/* Big Number */}
            <div className="text-6xl font-black text-black tracking-tighter">
                {value}
            </div>

            {/* Label */}
            <div className="text-black font-black mt-2 uppercase text-xs tracking-widest">
                {label}
            </div>

            {sublabel && (
                <div className="text-[10px] font-black text-black mt-1 uppercase tracking-tight">
                    {sublabel}
                </div>
            )}

            {/* Preview (e.g., upcoming items) */}
            {preview && (
                <div className="mt-6 pt-4 border-t border-black">
                    {preview}
                </div>
            )}

            {/* Comparison */}
            {comparison && (
                <div className="mt-6 pt-4 border-t border-black text-[10px] font-black uppercase tracking-tighter flex justify-between items-center">
                    <span className="text-black">{comparison.label} </span>
                    <span className="font-black text-black text-lg">
                        {comparison.value}
                    </span>
                </div>
            )}
        </Card>
    );
}

export default BigNumberCard;
