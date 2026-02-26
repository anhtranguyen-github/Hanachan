'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Swords, ChevronRight, Target, TrendingUp } from 'lucide-react';
import { fetchUserDashboardStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';

export default function ReviewPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const loadRealStats = async () => {
        if (!user) return;
        try {
            const dashboardStats = await fetchUserDashboardStats(user.id);
            const estimatedTime = Math.ceil(dashboardStats.reviewsDue * 0.5);

            setStats({
                due: dashboardStats.reviewsDue,
                breakdown: dashboardStats.dueBreakdown,
                estimatedTime,
                retention: dashboardStats.retention
            });
        } catch (error) {
            console.error("Failed to load review stats:", error);
            setStats({ due: 0, breakdown: { learning: 0, review: 0 }, estimatedTime: 0, retention: 0 });
        }
    };

    useEffect(() => {
        setMounted(true);
        if (user) {
            loadRealStats();
        }
    }, [user]);

    if (!mounted || !stats) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FFB5B5] animate-spin" />
            </div>
        );
    }

    const hasReviews = stats.due > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-sm font-sans text-foreground animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-sm hover:border-[#FFB5B5] transition-all group min-h-[320px] relative overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-[#FFF5F5] flex items-center justify-center text-[#FFB5B5] shadow-inner relative z-10 transition-transform group-hover:scale-110">
                        <Swords size={32} />
                    </div>

                    <div className="space-y-2 relative z-10">
                        <h3 className="text-3xl font-black uppercase tracking-tight text-[#3E4A61]">
                            {stats.due} Reviews Due
                        </h3>
                        <p className="text-sm text-[#A0AEC0] font-bold italic tracking-tight group-hover:text-[#FFB5B5] transition-colors">
                            {hasReviews ? 'Ready to strengthen your memory?' : 'You are all caught up for now!'}
                        </p>
                    </div>

                    {hasReviews ? (
                        <Link
                            href="/review/session"
                            className="w-full mt-4 py-4 px-8 bg-[#3E4A61] text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#2D3748] transition-all shadow-lg active:scale-95"
                        >
                            Begin Session
                            <ChevronRight size={14} />
                        </Link>
                    ) : (
                        <Link
                            href="/dashboard"
                            className="w-full mt-4 py-4 px-8 border-2 border-[#F0E0E0] rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61] hover:bg-[#F7FAFC] transition-all"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm flex-1 flex flex-col justify-center space-y-6">
                        <div className="flex items-center gap-3">
                            <Target size={16} className="text-[#A0AEC0]" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Session Breakdown</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-[#F7FAFC] border border-[#EDF2F7] rounded-3xl space-y-1">
                                <span className="block text-2xl font-black text-[#3E4A61]">{stats.breakdown?.learning || 0}</span>
                                <span className="text-[9px] font-black uppercase text-[#A0AEC0] tracking-widest leading-none">Learning Items</span>
                            </div>
                            <div className="p-5 bg-[#F7FAFC] border border-[#EDF2F7] rounded-3xl space-y-1">
                                <span className="block text-2xl font-black text-[#3E4A61]">{stats.breakdown?.review || 0}</span>
                                <span className="text-[9px] font-black uppercase text-[#A0AEC0] tracking-widest leading-none">Review Items</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#3E4A61] rounded-[40px] p-8 text-white flex items-center justify-between shadow-xl">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Estimated Time</span>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-[#FFB5B5]" />
                                <span className="text-xl font-black tracking-tight">{stats.estimatedTime} Minutes</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <span className="text-xl font-black text-[#FFB5B5] italic">~</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

