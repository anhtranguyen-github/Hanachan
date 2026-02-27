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
    const [forecastType, setForecastType] = useState<'hourly' | 'daily'>('hourly');

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
            {/* Header / Hero Section - Simplified */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_12px_rgba(244,172,183,0.4)]" />
                    <div>
                        <h1 className="text-3xl font-black text-[#3E4A61] tracking-tighter leading-none">
                            Konnichiwa, <span className="text-primary">{displayName}</span>!
                        </h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#CBD5E0] mt-1">
                            {today} • Level {userLevel}
                        </p>
                    </div>
                </div>
            </header>

            {/* Top Stat Row - WaniKani Inspired */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* Study Streak Card */}
                <div className="glass-card p-8 flex flex-col justify-between space-y-6 group overflow-hidden relative">
                    <div className="flex justify-between items-start relative z-10">
                        <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">Study Streak</h3>
                        <div className="text-right">
                            <span className="text-4xl font-black text-primary leading-none">{stats.streak}日</span>
                            <p className="text-[9px] font-black uppercase text-[#CBD5E0] mt-1">Best Recovery: 2日</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end relative z-10">
                        <div className="flex gap-1.5">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                const isToday = idx === new Date().getDay();
                                const hasActivity = stats.streak > (6 - idx); // Dummy logic for visual
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <span className={clsx("text-[9px] font-black", isToday ? "text-primary" : "text-[#CBD5E0]/60")}>{day}</span>
                                        <div className={clsx(
                                            "w-8 h-2.5 rounded-full transition-all duration-700",
                                            hasActivity ? "bg-primary shadow-[0_0_12px_rgba(244,172,183,0.4)]" : "bg-[#F7FAFC] border border-border/5"
                                        )} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex -space-x-1 opacity-20 hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-surface border-2 border-white flex items-center justify-center text-xs shadow-sm">🐢</div>
                            <div className="w-8 h-8 rounded-full bg-surface border-2 border-white flex items-center justify-center text-xs shadow-sm">🍣</div>
                        </div>
                    </div>
                </div>

                {/* Daily Status Report */}
                <div className="glass-card p-8 flex justify-between group overflow-hidden relative">
                    <div className="space-y-6 relative z-10 flex flex-col justify-between h-full">
                        <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter text-left">Daily Progress</h3>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-5xl font-black text-[#48BB78] drop-shadow-sm">{stats.reviewsToday}</span>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-[#3E4A61] uppercase leading-none block">Reviews</span>
                                    <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest leading-none">Completed</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-border/20" />
                            <div className="flex items-center gap-3">
                                <span className="text-5xl font-black text-primary drop-shadow-sm">{stats.retention}%</span>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-[#3E4A61] uppercase leading-none block">Accuracy</span>
                                    <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest leading-none">Stable</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all duration-1000 transform group-hover:scale-110 pointer-events-none">
                        <Target size={180} className="text-[#3E4A61]" />
                    </div>
                </div>
            </div>

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
                                stats.due > 0 ? "hover:border-primary cursor-pointer shadow-[0_20px_50px_rgba(244,172,183,0.1)]" : "opacity-80 grayscale-[20%]"
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
                                <p className="text-xs font-bold text-[#CBD5E0] group-hover:text-primary transition-colors duration-500">
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
                                <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">
                                    Discovery Queue
                                </h3>

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

                    {/* Detailed Level Progress - WaniKani Style */}
                    <div className="glass-card p-10 space-y-8">
                        <div className="flex justify-between items-end">
                            <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">Level Progression</h3>
                            <div className="text-right">
                                <span className="text-3xl font-black text-primary drop-shadow-sm">{stats.progression.percentage}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { type: 'Radicals', key: 'radical', color: 'bg-radical/10 text-radical border-radical/20', icon: '#' },
                                { type: 'Kanji', key: 'kanji', color: 'bg-kanji/10 text-kanji border-kanji/20', icon: '火' },
                                { type: 'Vocabulary', key: 'vocabulary', color: 'bg-vocab/10 text-vocab border-vocab/20', icon: '語' },
                                { type: 'Grammar', key: 'grammar', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '文' }
                            ].map((cat) => {
                                const data = stats.levelStats?.typeStats?.[cat.key as keyof typeof stats.levelStats.typeStats] || { mastered: 0, total: 0 };
                                const pct = Math.round((data.mastered / Math.max(data.total, 1)) * 100);

                                return (
                                    <div key={cat.key} className={clsx("p-6 rounded-3xl border flex flex-col justify-between space-y-6 hover:scale-[1.03] hover:shadow-xl transition-all duration-700 bg-white shadow-sm border-border/30 group", cat.key === 'radical' ? "hover:border-radical/30" : cat.key === 'kanji' ? "hover:border-kanji/30" : "hover:border-vocab/30")}>
                                        <div className="flex justify-between items-start">
                                            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-jp font-black shadow-inner bg-surface", cat.color)}>
                                                {cat.icon}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">{cat.type}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end px-1">
                                                <span className="text-3xl font-black text-[#3E4A61] tracking-tighter">{data.mastered}<span className="text-xs text-[#CBD5E0] ml-1 font-bold">/ {data.total}</span></span>
                                                <span className={clsx("text-xs font-black", pct > 0 ? "text-primary" : "text-[#CBD5E0]")}>{pct}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#F7FAFC] rounded-full overflow-hidden border border-border/5 shadow-inner">
                                                <div
                                                    className={clsx(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        cat.key === 'radical' ? "bg-radical" :
                                                            cat.key === 'kanji' ? "bg-kanji" :
                                                                cat.key === 'vocabulary' ? "bg-vocab" : "bg-blue-500"
                                                    )}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-6 border-t border-border/10 flex items-center justify-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-kanji animate-pulse" />
                            <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest text-center">
                                Guru {Math.max(0, Math.ceil((stats.levelStats?.typeStats?.kanji?.total || 0) * 0.9) - (stats.levelStats?.typeStats?.kanji?.mastered || 0))} more kanji to reach Level {userLevel + 1}
                            </p>
                            <div className="w-1.5 h-1.5 rounded-full bg-kanji animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Secondary Data */}
                <div className="lg:col-span-4 space-y-8">
                    {/* SRS Spread Card - WaniKani Inspired */}
                    <div className="glass-card p-10 space-y-8 flex flex-col h-full" data-testid="srs-spread-card">
                        <h3 className="text-xl font-black text-[#3E4A61] tracking-tight">Learning Balance</h3>

                        <div className="flex-1 space-y-6 flex flex-col justify-center py-4">
                            {[
                                { label: 'Apprentice', key: 'apprentice', color: 'bg-[#FF7EB9]', grad: 'from-[#FF7EB9] to-[#FFB5D8]' },
                                { label: 'Guru', key: 'guru', color: 'bg-[#B197FC]', grad: 'from-[#B197FC] to-[#D5C7FF]' },
                                { label: 'Master', key: 'master', color: 'bg-[#4DABF7]', grad: 'from-[#4DABF7] to-[#A5D8FF]' },
                                { label: 'Enlightened', key: 'enlightened', color: 'bg-[#91A7FF]', grad: 'from-[#91A7FF] to-[#D0EBFF]' },
                                { label: 'Burned', key: 'burned', color: 'bg-[#495057]', grad: 'from-[#495057] to-[#ADB5BD]' }
                            ].map((s) => {
                                const count = stats.srsSpread?.[s.key as keyof typeof stats.srsSpread] || 0;
                                const maxCount = Math.max(...Object.values(stats.srsSpread || {}).map(v => typeof v === 'number' ? v : 0), 1);
                                const barPct = Math.round((count / maxCount) * 100);

                                return (
                                    <div key={s.key} className="space-y-2 group">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#3E4A61]/60 group-hover:text-[#3E4A61] transition-colors">{s.label}</span>
                                            <span className="text-xs font-black text-[#3E4A61]">{count}</span>
                                        </div>
                                        <div className="h-4 bg-[#F7FAFC] rounded-xl overflow-hidden border border-border/10 p-1 group-hover:shadow-md transition-shadow">
                                            <div
                                                className={clsx("h-full rounded-lg transition-all duration-1000 bg-gradient-to-r shadow-sm", s.grad)}
                                                style={{ width: `${Math.max(4, barPct)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-8 border-t border-border/20">
                            <div className="flex items-center justify-between group cursor-help">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#3E4A61]/60">System Health</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                        <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">Global Stability: Normal</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-[#A2D2FF10] rounded-2xl text-[#3A6EA5] border border-[#A2D2FF10] group-hover:scale-110 transition-all">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Forecast Card */}
                <div className="glass-card p-10 space-y-8 flex flex-col">
                    <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">Review Forecast</h3>
                        <div className="flex bg-[#F7FAFC] p-1 rounded-2xl border border-border/10">
                            <button
                                onClick={() => setForecastType('hourly')}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    forecastType === 'hourly' ? "bg-white text-primary shadow-sm" : "text-[#A0AEC0] hover:text-[#3E4A61]"
                                )}
                            >
                                Hourly
                            </button>
                            <button
                                onClick={() => setForecastType('daily')}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    forecastType === 'daily' ? "bg-white text-[#3A6EA5] shadow-sm" : "text-[#A0AEC0] hover:text-[#3E4A61]"
                                )}
                            >
                                Daily
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[220px] flex items-end gap-3 pb-4 overflow-x-auto no-scrollbar">
                        {forecastType === 'hourly' ? (
                            stats.forecast?.hourly?.map((h: any, i: number) => {
                                const maxCount = Math.max(...stats.forecast.hourly.map((x: any) => x.count), 1);
                                const hPct = (h.count / maxCount) * 100;
                                const timeLabel = new Date(h.time).getHours();
                                const isNow = i === 0;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 min-w-[32px] group relative">
                                        <div className="flex-1 w-full flex items-end justify-center">
                                            <div
                                                className={clsx(
                                                    "w-3 rounded-full transition-all duration-1000",
                                                    isNow ? "bg-primary shadow-[0_0_15px_rgba(244,172,183,0.3)]" : "bg-[#F7FAFC] border border-border/5 group-hover:bg-[#FFD1DA]"
                                                )}
                                                style={{ height: `${Math.max(4, hPct)}%` }}
                                            />
                                        </div>
                                        <span className={clsx("text-[9px] font-black", isNow ? "text-primary" : "text-[#A0AEC0]")}>
                                            {timeLabel}h
                                        </span>
                                        {h.count > 0 && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3E4A61] text-white text-[8px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap">
                                                {h.count} items
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            stats.forecast?.daily?.map((d: any, i: number) => {
                                const maxCount = Math.max(...stats.forecast.daily.map((x: any) => x.count), 1);
                                const hPct = (d.count / maxCount) * 100;
                                const dateLabel = new Date(d.date).getDate();

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 min-w-[32px] group relative">
                                        <div className="flex-1 w-full flex items-end justify-center">
                                            <div
                                                className="w-4 bg-[#3A6EA5]/10 border border-[#3A6EA5]/5 rounded-full transition-all duration-1000 group-hover:bg-[#3A6EA5]/20"
                                                style={{ height: `${Math.max(4, hPct)}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-[#A0AEC0]">{dateLabel}</span>
                                        {d.count > 0 && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3E4A61] text-white text-[8px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap">
                                                {d.count} items
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Activity Card */}
                <div className="glass-card p-10 space-y-8 flex flex-col">
                    <div className="flex justify-between items-start">
                        <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter">Consistency Map</h3>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-primary">
                                <TrendingUp size={16} />
                                <span className="text-sm font-black">Target: 100+/day</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-wrap gap-1.5 justify-center max-w-[560px] mx-auto">
                            {Array.from({ length: 52 * 7 }).map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (52 * 7 - i));
                                const dateStr = date.toISOString().split('T')[0];
                                const count = stats.heatmap?.[dateStr] || 0;

                                let intensity = 0;
                                if (count > 0) intensity = 1;
                                if (count > 20) intensity = 2;
                                if (count > 50) intensity = 3;
                                if (count > 100) intensity = 4;

                                return (
                                    <div
                                        key={i}
                                        title={`${dateStr}: ${count} reviews`}
                                        className={clsx(
                                            "w-2.5 h-2.5 rounded-[3px] transition-all duration-500 hover:scale-150 cursor-crosshair",
                                            intensity === 0 && "bg-[#F7FAFC]",
                                            intensity === 1 && "bg-[#F4ACB733]",
                                            intensity === 2 && "bg-[#F4ACB766]",
                                            intensity === 3 && "bg-[#F4ACB7AA]",
                                            intensity === 4 && "bg-primary shadow-[0_0_8px_rgba(244,172,183,0.3)]"
                                        )}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-6 px-10">
                            <span className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Less Active</span>
                            <div className="flex gap-1.5">
                                {[0, 1, 2, 3, 4].map(idx => (
                                    <div
                                        key={idx}
                                        className={clsx(
                                            "w-2.5 h-2.5 rounded-[3px]",
                                            idx === 0 && "bg-[#F7FAFC]",
                                            idx === 1 && "bg-[#F4ACB733]",
                                            idx === 2 && "bg-[#F4ACB766]",
                                            idx === 3 && "bg-[#F4ACB7AA]",
                                            idx === 4 && "bg-primary"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Master Level</span>
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
