'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { useUser } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';

import { AI_QUOTA_LIMIT } from '@/types/quotas';

export function UsageMeter({ isExpanded }: { isExpanded: boolean }) {
    const { user } = useUser();

    if (!user) return null;

    const quota = user.role === 'ADMIN' ? Infinity : AI_QUOTA_LIMIT;
    const usage = (user as any).usage?.ai_calls?.count || 0;
    const percentage = quota === Infinity ? 0 : Math.min((usage / quota) * 100, 100);

    if (!isExpanded) {
        return (
            <div className="flex flex-col items-center py-4 border-t border-sakura-divider">
                <div className="relative">
                    <Zap size={18} className={cn(
                        percentage > 90 ? "text-red-500" :
                            percentage > 70 ? "text-amber-500" :
                                "text-sakura-accent-primary"
                    )} />
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 border-t border-sakura-divider space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-sakura-accent-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted">AI Usage</span>
                </div>
                <span className="text-[10px] font-bold text-sakura-text-secondary">{usage} / {quota}</span>
            </div>

            <div className="h-1.5 w-full bg-sakura-bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-1000",
                        percentage > 90 ? "bg-red-500" :
                            percentage > 70 ? "bg-amber-500" :
                                "bg-sakura-accent-primary"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {percentage > 80 && (
                <p className="text-[9px] font-bold text-amber-600 animate-pulse">
                    Running low! Upgrade for more.
                </p>
            )}
        </div>
    );
}
