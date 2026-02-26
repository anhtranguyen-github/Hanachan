'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Loader2,
    TrendingUp,
    BookOpen,
    GraduationCap,
    ChevronRight,
    CheckCircle2,
    Target
} from 'lucide-react';
import { clsx } from 'clsx';
import { fetchUserDashboardStats, fetchCurriculumStats, fetchDeckStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const { user } = useUser();
    const [userLevel, setUserLevel] = useState(1);
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const refreshData = async () => {
        if (!user) return;
        try {
            const userId = user.id;

            // 1. Fetch real user level
            const { data: profile } = await supabase
                .from('users')
                .select('level')
                .eq('id', userId)
                .single();

            const currentLevel = profile?.level || 1;
            setUserLevel(currentLevel);

            const dashboardStats = await fetchUserDashboardStats(userId);
            const curriculumStats = await fetchCurriculumStats();
            const levelStats = await fetchDeckStats(userId, `level-${currentLevel}`);

            setStats({
                ...dashboardStats,
                curriculum: curriculumStats,
                levelStats: levelStats,
                due: dashboardStats.reviewsDue,
                new: levelStats.new,
                retention: dashboardStats.retention,
                streak: dashboardStats.streak || 0,
                progression: {
                    percentage: Math.round((levelStats.learned / Math.max(levelStats.total, 1)) * 100),
                    passed: levelStats.learned,
                    total: levelStats.total,
                }
            });
        } catch (error) {
            console.error("Failed to refresh dashboard data:", error);
            setStats({
                due: 0,
                new: 0,
                retention: 0,
                streak: 0,
                reviewsToday: 0,
                mistakes: 0,
                progression: { percentage: 0, passed: 0, total: 100 },
                recentLevels: [1, 2, 3],
                heatmap: [],
                typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 }
            });
        }
    };

    useEffect(() => {
        setMounted(true);
        if (user) {
            refreshData();
        }
    }, [user]);

    if (!mounted || !stats) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FFB5B5] animate-spin" />
            </div>
        );
    }

    return (
        <div data-testid="dashboard-root" className="max-w-5xl mx-auto space-y-8 py-4 font-sans text-[#3E4A61] animate-in fade-in duration-1000">
            {/* Suggested Actions Divider */}
            <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F0E0E0]"></div>
                </div>
                <div className="relative bg-[#FFFDFD] px-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3E4A61]">Suggested Actions</span>
                </div>
            </div>

            {/* Core Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/review"
                    data-testid="review-card"
                    className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:border-[#FFB5B5] transition-all group min-h-[280px]"
                >
                    <div className="w-14 h-14 rounded-full bg-[#FFF5F5] flex items-center justify-center text-[#FFB5B5] shadow-inner">
                        <TrendingUp size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-[#3E4A61]">
                            <span data-testid="review-due-count">{stats.due}</span> Reviews Due
                        </h3>
                        <p className="text-xs text-[#A0AEC0] font-bold italic tracking-tight group-hover:text-[#FFB5B5] transition-colors">Time to practice your knowledge!</p>
                    </div>
                </Link>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-xl shadow-[#3E4A61]/5 flex flex-col justify-between relative overflow-hidden group min-h-[280px]">
                    <div className="absolute -right-6 -top-6 text-[#F7FAFC] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 opacity-40">
                        <GraduationCap size={160} strokeWidth={1} />
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-[#3E4A61]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#3E4A61]">New Content</span>
                            </div>
                            <h3 className="text-3xl font-black text-[#3E4A61]">Level {userLevel}</h3>
                            <p className="text-sm font-black text-[#FFB5B5] tracking-tight">Next Discovery Batch</p>
                        </div>

                        <div className="bg-[#F2E8E8] rounded-2xl p-4 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                                <span data-testid="learn-new-count">{stats.new}</span> New Lessons
                            </span>
                            <div className="flex -space-x-2.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-[#F2E8E8] flex items-center justify-center text-[8px] text-[#A0AEC0]">?</div>
                                ))}
                                <div className="w-6 h-6 rounded-full bg-[#FFB5B5] border-2 border-[#F2E8E8] flex items-center justify-center text-[8px] text-white font-bold">+</div>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/learn"
                        data-testid="learn-card"
                        className="relative z-10 mt-6 w-full py-4 px-8 border-2 border-[#F0E0E0] rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#3E4A61] hover:bg-[#3E4A61] hover:text-white hover:border-[#3E4A61] transition-all group/btn shadow-sm"
                    >
                        Unlock Batch
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Stats Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-6 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border-2 border-[#F7FAFC] rounded-xl flex items-center justify-center text-xl font-black text-[#FFB5B5] shadow-sm">
                                {userLevel}
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Level Progress</h4>
                                <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">
                                    {stats.progression.passed} / {stats.progression.total} Items Mastered
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[#FFB5B5]">{stats.progression.percentage}%</span>
                        </div>
                    </div>

                    <div className="h-2.5 bg-[#FFF5F5] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#FFB5B5] rounded-full shadow-[0_0_8px_rgba(255,181,181,0.5)] transition-all duration-1000"
                            style={{ width: `${stats.progression.percentage}%` }}
                        ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Retention Rate', value: `${stats.retention}%`, icon: <TrendingUp size={10} className="text-[#FFB5B5]" /> },
                            { label: 'Current Streak', value: `${stats.streak} Days`, icon: <span className="text-[10px]">🔥</span> },
                            { label: 'Today\'s Items', value: stats.reviewsToday, icon: <CheckCircle2 size={10} className="text-[#48BB78]" /> }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#F7FAFC] border border-[#EDF2F7] rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center">
                                <div className="flex items-center gap-2">
                                    {item.icon}
                                    <span className="text-sm font-black text-[#3E4A61]" data-testid={`stat-value-${i}`}>{item.value}</span>
                                </div>
                                <span className="text-[7px] font-black uppercase tracking-widest text-[#A0AEC0] leading-tight">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-6 flex flex-col justify-center" data-testid="accuracy-card">
                    <div className="flex items-center gap-2.5">
                        <Target size={14} className="text-[#A0AEC0]" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Daily Precision</h4>
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-[#A0AEC0]">Accuracy</span>
                            <span className="text-xl font-black text-[#3E4A61]" data-testid="accuracy-value">{stats.retention}%</span>
                        </div>
                        <div className="h-2 bg-[#F7FAFC] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#48BB78] transition-all duration-1000"
                                style={{ width: `${stats.retention}%` }}
                            />
                        </div>
                        <p className="text-[8px] font-bold text-[#A0AEC0] italic">
                            Keep up the momentum to reach your 90% stability goal!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

