/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swords, ChevronRight, Target, TrendingUp, X, Clock, Zap } from 'lucide-react';
import { fetchUserDashboardStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';
import { clsx } from 'clsx';

export default function ReviewPage() {
    const { user, openLoginModal } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const loadRealStats = async () => {
        try {
            const userId = user?.id;

            if (!userId) {
                // Preview stats for guests
                setStats({
                    due: 8,
                    breakdown: { learning: 3, review: 5 },
                    estimatedTime: 4,
                    retention: 92
                });
                return;
            }

            const dashboardStats = await fetchUserDashboardStats(userId);
            setStats({
                due: dashboardStats.reviewsDue,
                breakdown: dashboardStats.dueBreakdown,
                estimatedTime: Math.ceil(dashboardStats.reviewsDue * 0.5),
                retention: dashboardStats.retention
            });
        } catch (error) {
            setStats({ due: 0, breakdown: { learning: 0, review: 0 }, estimatedTime: 0, retention: 0 });
        }
    };

    useEffect(() => {
        setMounted(true);
        loadRealStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (!mounted || !stats) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#CDB4DB] rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-[#CDB4DB] to-[#B09AC5] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">復</div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-[#CDB4DB] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasReviews = stats.due > 0;

    return (
        <div className="max-w-2xl mx-auto space-y-4 font-sans text-foreground animate-page-entrance">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#CDB4DB] rounded-xl blur-md opacity-30" />
                        <div className="relative w-8 h-8 bg-gradient-to-br from-[#CDB4DB] to-[#B09AC5] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">復</div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-[#3E4A61] tracking-tight uppercase">Review</h2>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">Reinforce what you've learned</p>
                    </div>
                </div>
                <Link href="/dashboard" className="p-2 bg-white/80 border border-border/40 rounded-xl text-[#A0AEC0] hover:text-[#3E4A61] hover:border-primary/20 shadow-sm transition-all group backdrop-blur-sm">
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                </Link>
            </div>

            {/* Main action card */}
            <div className={clsx(
                "glass-card p-5 sm:p-8 flex flex-col items-center text-center space-y-4 relative overflow-hidden group",
                hasReviews ? "hover:border-[#CDB4DB]/30" : ""
            )}>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/40 to-transparent" />
                <div className="absolute -right-8 -bottom-8 text-[#CDB4DB]/5 group-hover:scale-110 transition-all duration-1000 pointer-events-none">
                    <Swords size={160} strokeWidth={1} />
                </div>

                <div className={clsx(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-[28px] flex items-center justify-center relative transition-all duration-500",
                    hasReviews ? "bg-gradient-to-br from-[#CDB4DB]/20 to-[#CDB4DB]/5 text-[#9B7DB5] group-hover:scale-110" : "bg-[#F7FAFC] text-[#CBD5E0]"
                )}>
                    {hasReviews && <div className="absolute inset-0 rounded-[24px] sm:rounded-[28px] bg-[#CDB4DB]/10 animate-ping opacity-30" />}
                    <Swords size={32} strokeWidth={2} />
                </div>

                <div className="space-y-1 relative z-10">
                    <h3 className="text-4xl sm:text-5xl font-black text-[#3E4A61] tracking-tighter">{stats.due}</h3>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#A0AEC0] block">Reviews Due</span>
                    <p className="text-sm text-[#A0AEC0] font-bold">
                        {hasReviews ? 'Ready to strengthen your memory?' : 'All caught up!'}
                    </p>
                </div>

                {hasReviews ? (
                    <button
                        onClick={() => !user ? openLoginModal() : (window.location.href = '/review/session')}
                        className="w-full py-4 bg-gradient-to-r from-[#9B7DB5] to-[#7B5D95] text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-[#9B7DB5]/25 hover:scale-[1.02] transition-all duration-300 group/btn relative z-10"
                    >
                        <Zap size={13} />
                        Start Review {!user && '(Sign In)'}
                        <ChevronRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                ) : (
                    <Link href="/dashboard" className="w-full py-4 border border-border/30 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] hover:bg-[#F7FAFC] transition-all relative z-10">
                        Back to Dashboard
                    </Link>
                )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/30 to-transparent" />
                    <div className="flex items-center gap-2">
                        <Target size={12} className="text-[#A0AEC0]" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-[#3E4A61]">Breakdown</h4>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">Learning</span>
                            <span className="text-base font-black text-[#3A6EA5]">{stats.breakdown?.learning || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">Review</span>
                            <span className="text-base font-black text-[#9B7DB5]">{stats.breakdown?.review || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/30 to-transparent" />
                    <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-[#A0AEC0]" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-[#3E4A61]">Stats</h4>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">~Time</span>
                            <span className="text-base font-black text-[#3E4A61]">{stats.estimatedTime}m</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">Accuracy</span>
                            <span className="text-base font-black text-[#9B7DB5]">{stats.retention}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
