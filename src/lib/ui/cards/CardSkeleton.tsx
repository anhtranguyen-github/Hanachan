'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * CardSkeleton - Loading skeleton states for cards.
 */

interface CardSkeletonProps {
    variant?: 'default' | 'action' | 'chart' | 'stat';
    className?: string;
}

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={cn(
                'animate-pulse bg-muted/50 rounded',
                className
            )}
            style={style}
        />
    );
}

export function CardSkeleton({ variant = 'default', className }: CardSkeletonProps) {
    if (variant === 'stat') {
        return (
            <div className={cn('bg-card border border-border/30 rounded-2xl p-5', className)}>
                <div className="flex items-center gap-4">
                    <Pulse className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Pulse className="h-8 w-20" />
                        <Pulse className="h-4 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div className={cn('bg-card border border-border/30 rounded-2xl p-5', className)}>
                <div className="flex items-center justify-between mb-4">
                    <Pulse className="h-5 w-32" />
                    <Pulse className="h-4 w-16" />
                </div>
                <div className="flex items-end gap-2 h-32">
                    {[...Array(8)].map((_, i) => (
                        <Pulse
                            key={i}
                            className="flex-1 rounded-t"
                            style={{ height: `${Math.random() * 60 + 20}%` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'action') {
        return (
            <div className={cn('bg-card border border-border/30 rounded-2xl p-5', className)}>
                <div className="flex items-start gap-4">
                    <Pulse className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <Pulse className="h-5 w-24" />
                            <Pulse className="h-5 w-8 rounded-full" />
                        </div>
                        <Pulse className="h-4 w-40" />
                        <Pulse className="h-10 w-32 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Default
    return (
        <div className={cn('bg-card border border-border/30 rounded-2xl p-5', className)}>
            <div className="flex items-center gap-3 mb-4">
                <Pulse className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                    <Pulse className="h-4 w-24" />
                    <Pulse className="h-3 w-32" />
                </div>
            </div>
            <div className="space-y-3">
                <Pulse className="h-4 w-full" />
                <Pulse className="h-4 w-3/4" />
                <Pulse className="h-4 w-1/2" />
            </div>
        </div>
    );
}

export default CardSkeleton;
