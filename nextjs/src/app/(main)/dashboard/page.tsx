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
import { fetchUserDashboardStats, fetchCurriculumStats, fetchLevelStats } from '@/features/learning/service';
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
            const levelStats = await fetchLevelStats(userId, `level-${currentLevel}`);

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

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <main data-testid="dashboard-root" className="max-w-[1400px] mx-auto space-y-xl animate-page-entrance px-4 lg:px-0">
            {/* Header / Hero Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-xl border-b border-border/20">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_12px_rgba(244,172,183,0.4)]" />
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-[#3E4A61] tracking-tighter leading-none">
                                Konnichiwa, <span className="text-primary">{displayName}</span>!
                            </h1>
                            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-[#A0AEC0] mt-2 italic">
                                Systems Online • {today} • Level {userLevel}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {[
                        { label: 'Retention', val: `${stats.retention}%`, color: 'text-primary' },
                        { label: 'Streak', val: stats.streak, suffix: ' Days', color: 'text-[#3A6EA5]' },
                        { label: 'Items', val: stats.reviewsToday, suffix: ' Today', color: 'text-[#48BB78]' }
                    ].map((s, i) => (
                        <div key={i} className="flex-1 md:flex-none glass-card px-6 py-4 flex flex-col items-center justify-center min-w-[120px]">
                            <span className={clsx("text-xl font-black leading-none mb-1", s.color)}>
                                {s.val}{s.suffix || ''}
                            </span>
                            <span className="text-[8px] font-black uppercase text-[#CBD5E0] tracking-widest">{s.label}</span>
                        </div>
                    ))}
                </div>
            </header>

            {/* Core Interaction Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                {/* Left Column: Primary Actions */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Review Action */}
                        <Link
                            href="/review"
                            data-testid="review-card"
                            className={clsx(
                                "glass-card p-10 flex flex-col items-center justify-center text-center space-y-6 group transition-all duration-700 min-h-[300px] border-2 border-transparent",
                                stats.due > 0 ? "hover:border-primary cursor-pointer" : "opacity-80 grayscale-[20%]"
                            )}
                        >
                            <div className={clsx(
                                "w-20 h-20 rounded-[32px] flex items-center justify-center transition-all duration-700 shadow-inner group-hover:scale-110",
                                stats.due > 0 ? "bg-primary/10 text-primary animate-pulse" : "bg-gray-100 text-gray-300"
                            )}>
                                <TrendingUp size={36} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-4xl font-black text-[#3E4A61] tracking-tighter">
                                    {stats.due} <span className="text-lg uppercase tracking-widest block mt-1 text-[#A0AEC0]">Reviews Due</span>
                                </h3>
                                <p className="text-xs font-bold italic text-[#CBD5E0] group-hover:text-primary transition-colors duration-500">
                                    {stats.due > 0 ? "Your memory needs reinforcement." : "Memory sectors are temporarily stable."}
                                </p>
                            </div>
                        </Link>

                        {/* Discovery Action */}
                        <div className="glass-card p-10 flex flex-col justify-between group min-h-[300px] relative overflow-hidden bg-white">
                            <div className="absolute -right-8 -top-8 text-[#A2D2FF15] transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000">
                                <GraduationCap size={220} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#A2D2FF]" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A0AEC0]">Discovery Queue</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">
                                        Level {userLevel} <span className="text-primary italic">Batch</span>
                                    </h3>
                                </div>

                                <div className="bg-[#A2D2FF08] rounded-2xl p-6 border border-[#A2D2FF15] flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-2xl font-black text-[#3A6EA5] tracking-tighter">
                                            {stats.new}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0] block">New Lessons</span>
                                    </div>
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#F7FAFC] flex items-center justify-center text-[10px] text-[#A0AEC0] font-black shadow-sm">?</div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full bg-[#A2D2FF] border-2 border-white flex items-center justify-center text-[10px] text-white font-black shadow-sm">+</div>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href="/learn"
                                data-testid="learn-card"
                                className="relative z-10 w-full py-5 bg-[#3A6EA5] text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#2D5A8A] hover:scale-[1.02] transition-all shadow-xl shadow-[#3A6EA5]/20 group/btn"
                            >
                                START DISCOVERY
                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Progress Detail Card */}
                    <div className="glass-card p-10 space-y-10">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-[#FFF2F2] border-2 border-primary/20 rounded-3xl flex items-center justify-center text-3xl font-black text-primary shadow-sm italic">
                                    {userLevel}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-[#3E4A61] tracking-tight">Curriculum Progression</h4>
                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">
                                        {stats.progression.passed} / {stats.progression.total} Items Mastered Locally
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-primary italic drop-shadow-sm">{stats.progression.percentage}%</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="h-4 bg-[#F7FAFC] rounded-full p-1 shadow-inner border border-border/20">
                                <div
                                    className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full shadow-[0_0_15px_rgba(244,172,183,0.3)] transition-all duration-1000 ease-out"
                                    style={{ width: `${stats.progression.percentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between px-2">
                                <span className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-[0.2em]">Initiation</span>
                                <span className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-[0.2em]">Level Completion</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Secondary Data */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Accuracy Card */}
                    <div className="glass-card p-10 space-y-8 h-full flex flex-col justify-between" data-testid="accuracy-card">
                        <div className="space-y-6 flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center border border-green-100">
                                        <Target size={16} />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3E4A61]">Daily Precision</h4>
                                </div>
                                <span className="text-2xl font-black text-[#48BB78] italic">{stats.retention}%</span>
                            </div>

                            <div className="space-y-6">
                                <div className="h-2 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10">
                                    <div
                                        className="h-full bg-[#48BB78] transition-all duration-1000 delay-500"
                                        style={{ width: `${stats.retention}%` }}
                                    />
                                </div>
                                <p className="text-[11px] font-bold text-[#A0AEC0] italic leading-relaxed">
                                    "Accuracy is the byproduct of focused repetition. Your current 90% stability goal is within reach."
                                </p>
                            </div>
                        </div>

                        {/* Recent Level Stats */}
                        <div className="pt-8 border-t border-border/20 mt-auto">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0] mb-4">Mastery Domains</h4>
                            <div className="space-y-4">
                                {[
                                    { type: 'Radical', p: 85 },
                                    { type: 'Kanji', p: 42 },
                                    { type: 'Vocab', p: 12 }
                                ].map((d, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="w-12 text-[9px] font-black text-[#3E4A61] uppercase">{d.type}</span>
                                        <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/30" style={{ width: `${d.p}%` }} />
                                        </div>
                                        <span className="text-[9px] font-bold text-[#A0AEC0]">{d.p}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty Space / Footer Branding */}
            <div className="py-20 text-center opacity-10 select-none pointer-events-none">
                <h2 className="text-7xl font-black tracking-widest text-[#3E4A61]">HANACHAN V2</h2>
                <p className="text-xs font-black uppercase tracking-[1em] mt-4">Cognitive Mastery System</p>
            </div>
        </main>
    );
}
