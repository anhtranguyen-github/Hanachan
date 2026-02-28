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
    Target,
    Sparkles,
    Flame,
    Zap,
    Activity,
    BookMarked,
    Video,
} from 'lucide-react';
import { clsx } from 'clsx';
import { fetchUserDashboardStats, fetchCurriculumStats, fetchLevelStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { HanaTime } from '@/lib/time';

export default function DashboardPage() {
    const { user, openLoginModal } = useUser();
    const [userLevel, setUserLevel] = useState(1);
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [forecastType, setForecastType] = useState<'hourly' | 'daily'>('hourly');

    const refreshData = async () => {
        try {
            const userId = user?.id;

            // If no user, show preview stats
            if (!userId) {
                const curriculumStats = await fetchCurriculumStats();
                setStats({
                    due: 12, new: 5, retention: 94, streak: 0, reviewsToday: 0,
                    minutesSpent: 0, totalLearned: 24, totalBurned: 5,
                    progression: { percentage: 15, passed: 12, total: 80 },
                    curriculum: curriculumStats,
                    levelStats: {
                        total: 80, learned: 12, mastered: 5, typeStats: {
                            radical: { total: 10, mastered: 5 },
                            kanji: { total: 30, mastered: 0 },
                            vocabulary: { total: 40, mastered: 0 },
                            grammar: { total: 5, mastered: 0 }
                        }
                    },
                    forecast: {
                        hourly: Array.from({ length: 24 }, (_, i) => ({ time: new Date(Date.now() + i * 3600000).toISOString(), count: Math.floor(Math.random() * 5) })),
                        daily: Array.from({ length: 14 }, (_, i) => ({ date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0], count: Math.floor(Math.random() * 20) })),
                        total: 45
                    },
                    heatmap: {},
                    typeMastery: { radical: 40, kanji: 10, vocabulary: 5, grammar: 0 },
                    srsSpread: { apprentice: 12, guru: 8, master: 4, enlightened: 0, burned: 5 },
                    totalKUCoverage: 2
                });
                return;
            }

            const { data: profile } = await supabase.from('users').select('level').eq('id', userId).single();
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
            // Default fallback stats
            setStats({
                due: 0, new: 0, retention: 0, streak: 0, reviewsToday: 0, mistakes: 0,
                progression: { percentage: 0, passed: 0, total: 100 },
                recentLevels: [1, 2, 3], heatmap: [],
                typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 }
            });
        }
    };

    useEffect(() => {
        setMounted(true);
        refreshData();
        const checkInterval = setInterval(() => {
            if (user && HanaTime.getSpeed() > 1) refreshData();
        }, 5000);
        return () => clearInterval(checkInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (!mounted || !stats) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-14 h-14 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/30">
                            花
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const isGuest = !user;
    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest Learner';
    const today = HanaTime.getNow().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <main data-testid="dashboard-root" className="max-w-[1400px] mx-auto space-y-4 animate-page-entrance">

            {/* Guest Banner */}
            {isGuest && (
                <div className="relative p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-[#CDB4DB]/10 to-[#A2D2FF]/10 border border-primary/20 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md" />
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg border border-white/20">
                                ✨
                            </div>
                            <div className="text-left">
                                <h2 className="text-xl font-black text-[#3E4A61] tracking-tight leading-tight">Guest Mode Active</h2>
                                <p className="text-sm text-[#A0AEC0] font-bold mt-0.5">Progress tracking and AI tutors are only available for members.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => openLoginModal()}
                                className="flex-1 md:flex-none px-8 py-3 bg-white text-[#F4ACB7] font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition-all border border-white"
                            >
                                Sign In
                            </button>
                            <Link
                                href="/signup"
                                className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-[#F4ACB7] to-[#D88C9A] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Join Now
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-48 h-48 bg-gradient-to-br from-primary/8 to-[#CDB4DB]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10 text-left">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#D88C9A] rounded-2xl blur-lg opacity-20 animate-pulse-slow" />
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-primary/25">
                            花
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black text-[#3E4A61] tracking-tighter leading-none">
                            {isGuest ? 'Welcome to ' : 'Konnichiwa, '}<span className="gradient-text-sakura">{isGuest ? 'HanaChan' : displayName}</span>!
                        </h1>
                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-[#CBD5E0] mt-1 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-primary rounded-full inline-block" />
                            <span className="hidden sm:inline">{today} •</span>
                            {isGuest ? 'Public Preview' : `Level ${userLevel}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-primary/15 rounded-2xl shadow-sm">
                        <Flame size={11} className="text-primary" />
                        <span className="text-[9px] font-black text-[#3E4A61] uppercase tracking-widest">{stats.streak}d</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#48BB78]/20 rounded-2xl shadow-sm">
                        <Sparkles size={11} className="text-[#48BB78]" />
                        <span className="text-[9px] font-black text-[#3E4A61] uppercase tracking-widest">{stats.retention}%</span>
                    </div>
                </div>
            </header>

            {/* Primary Action Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Review Card */}
                <Link
                    href="/review"
                    data-testid="review-card"
                    className={clsx(
                        "glass-card p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-3 group transition-all duration-500 min-h-[140px] sm:min-h-[180px] border-2 border-transparent relative overflow-hidden",
                        stats.due > 0 ? "hover:border-primary/30 cursor-pointer" : "opacity-70"
                    )}
                >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    <div className={clsx(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[28px] flex items-center justify-center transition-all duration-500 relative",
                        stats.due > 0 ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary group-hover:scale-110" : "bg-gray-100 text-gray-300"
                    )}>
                        {stats.due > 0 && <div className="absolute inset-0 rounded-[20px] sm:rounded-[28px] bg-primary/10 animate-ping opacity-30" />}
                        <TrendingUp size={24} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5 relative z-10">
                        <h3 className="text-2xl sm:text-4xl font-black text-[#3E4A61] tracking-tighter">{stats.due}</h3>
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] block">Reviews Due</span>
                    </div>
                </Link>

                {/* Learn Card */}
                <Link
                    href="/learn"
                    data-testid="learn-card"
                    className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-3 group transition-all duration-500 min-h-[140px] sm:min-h-[180px] border-2 border-transparent hover:border-[#A2D2FF]/30 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/30 to-transparent" />
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[28px] flex items-center justify-center bg-gradient-to-br from-[#A2D2FF]/15 to-[#A2D2FF]/5 text-[#3A6EA5] group-hover:scale-110 transition-all duration-500 relative">
                        <GraduationCap size={24} strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5 relative z-10">
                        <h3 className="text-2xl sm:text-4xl font-black text-[#3E4A61] tracking-tighter">{stats.new}</h3>
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] block">New Lessons</span>
                    </div>
                </Link>
            </div>

            {/* Quick Access Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Reading Practice Quick Access */}
                <Link
                    href="/reading"
                    className="glass-card p-4 flex items-center gap-4 group transition-all duration-300 hover:border-[#7BB8F0]/30 border-2 border-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#7BB8F0]/20 to-transparent" />
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center bg-gradient-to-br from-[#7BB8F0]/15 to-[#7BB8F0]/5 text-[#3A6EA5] group-hover:scale-110 transition-all duration-500 shrink-0">
                        <BookMarked size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-black text-[#3E4A61] tracking-tight">Reading Practice</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">AI-generated passages • Personalized</p>
                    </div>
                    <ChevronRight size={16} className="text-[#CBD5E0] group-hover:text-[#3A6EA5] transition-colors shrink-0" />
                </Link>

                {/* Video Library Quick Access */}
                <Link
                    href="/videos"
                    className="glass-card p-4 flex items-center gap-4 group transition-all duration-300 hover:border-[#FF9F9F]/30 border-2 border-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF9F9F]/20 to-transparent" />
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center bg-gradient-to-br from-[#FF9F9F]/15 to-[#FF9F9F]/5 text-[#C0392B] group-hover:scale-110 transition-all duration-500 shrink-0">
                        <Video size={20} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-black text-[#3E4A61] tracking-tight">Video Library</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">Interactive subtitles • JLPT analysis</p>
                    </div>
                    <ChevronRight size={16} className="text-[#CBD5E0] group-hover:text-[#C0392B] transition-colors shrink-0" />
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Streak', value: `${stats.streak}日`, color: '#F4ACB7' },
                    { label: 'Accuracy', value: `${stats.retention}%`, color: '#48BB78' },
                    { label: 'Today', value: stats.reviewsToday, color: '#4DABF7' },
                    { label: 'Progress', value: `${stats.progression.percentage}%`, color: '#CDB4DB' },
                ].map((s) => (
                    <div key={s.label} className="glass-card p-3 sm:p-4 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
                        <div className="text-xl sm:text-2xl font-black tracking-tighter" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0] mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Level Progression */}
            <div className="glass-card p-4 sm:p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/30 to-transparent" />
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-base sm:text-xl font-black text-[#3E4A61] tracking-tighter">Level {userLevel} Progress</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">By type</p>
                    </div>
                    <span className="text-xl sm:text-2xl font-black gradient-text-sakura">{stats.progression.percentage}%</span>
                </div>

                {/* Overall bar */}
                <div className="h-1.5 w-full bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10 shadow-inner">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#D88C9A] transition-all duration-1000" style={{ width: `${stats.progression.percentage}%` }} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                        { type: 'Radicals', key: 'radical', color: 'var(--radical)', icon: '#' },
                        { type: 'Kanji', key: 'kanji', color: 'var(--kanji)', icon: '火' },
                        { type: 'Vocab', key: 'vocabulary', color: 'var(--vocab)', icon: '語' },
                        { type: 'Grammar', key: 'grammar', color: 'var(--grammar)', icon: '文' }
                    ].map((cat) => {
                        const data = stats.levelStats?.typeStats?.[cat.key as keyof typeof stats.levelStats.typeStats] || { mastered: 0, total: 0 };
                        const pct = Math.round((data.mastered / Math.max(data.total, 1)) * 100);
                        return (
                            <div key={cat.key} className="p-3 rounded-2xl border bg-white/60 flex flex-col gap-2 hover:scale-[1.02] transition-all duration-300" style={{ borderColor: `${cat.color}30` }}>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-black" style={{ color: cat.color }}>{cat.icon}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">{cat.type}</span>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-base font-black text-[#3E4A61]">{data.mastered}<span className="text-[9px] text-[#CBD5E0] ml-0.5">/{data.total}</span></span>
                                        <span className="text-[9px] font-black" style={{ color: pct > 0 ? cat.color : '#CBD5E0' }}>{pct}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-[#F7FAFC] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Growth & Coverage - MERGED FROM PROGRESS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Curriculum Status */}
                <div className="glass-card p-4 sm:p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFB5B5]/30 to-transparent" />
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-[#3E4A61] tracking-tight text-left">Curriculum Status</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5 text-left">Overall item distribution</p>
                    </div>
                    <div className="space-y-4 mt-2">
                        {[
                            { label: 'Mastered', count: stats.totalBurned, color: '#F4ACB7', gradient: 'from-[#F4ACB7] to-[#D88C9A]' },
                            { label: 'In Review', count: stats.dueBreakdown?.review || 0, color: '#CDB4DB', gradient: 'from-[#CDB4DB] to-[#B09AC5]' },
                            { label: 'Learning', count: stats.dueBreakdown?.learning || 0, color: '#A2D2FF', gradient: 'from-[#A2D2FF] to-[#7BB8F0]' },
                            { label: 'Overall Coverage', count: Math.round(stats.totalKUCoverage || 0), suffix: '%', color: '#3E4A61', gradient: 'from-[#3E4A61] to-[#4A5568]' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[10px] font-black text-[#3E4A61]">{item.count}{item.suffix || ''}</span>
                                </div>
                                <div className="h-2 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10 shadow-inner p-[1px]">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${item.gradient}`}
                                        style={{ width: `${item.suffix === '%' ? item.count : Math.min(100, (item.count / Math.max(stats.totalLearned || 1, 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Domain Mastery Grid */}
                <div className="relative rounded-[2rem] p-4 sm:p-6 text-white space-y-4 flex flex-col shadow-xl overflow-hidden min-h-[220px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2D3748] to-[#1A202C]" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F4ACB7]/40 to-transparent" />

                    <div className="relative z-10 flex items-center gap-2">
                        <div className="p-1.5 bg-white/5 rounded-xl border border-white/10">
                            <Sparkles size={14} className="text-[#F4ACB7]" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-white/95 tracking-tight text-left">Domain Mastery</h3>
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/30 text-left">Overall proficiency</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 items-center relative z-10 mt-2">
                        {Object.entries(stats.typeMastery || {}).map(([type, percent]: [string, any]) => {
                            const typeColors: Record<string, string> = {
                                radical: '#A2D2FF', kanji: '#F4ACB7', vocabulary: '#CDB4DB', grammar: '#B7E4C7',
                            };
                            const color = typeColors[type] || '#F4ACB7';
                            return (
                                <div key={type} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                                        <span className="text-white/40">{type}</span>
                                        <span style={{ color }}>{percent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden p-[0.5px]">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-white/8 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <Activity size={12} className="text-[#F4ACB7]" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/25">Retention Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#48BB78] shadow-[0_0_8px_rgba(72,187,120,0.5)]" />
                            <span className="text-lg font-black text-white/90">{stats.retention}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SRS Spread + Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* SRS Spread */}
                <div className="glass-card p-4 sm:p-6 space-y-4 relative overflow-hidden" data-testid="srs-spread-card">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF7EB9]/30 to-transparent" />
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-[#3E4A61] tracking-tight text-left">Learning Balance</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5 text-left">By SRS stage</p>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Apprentice', key: 'apprentice', color: '#FF7EB9' },
                            { label: 'Guru', key: 'guru', color: '#B197FC' },
                            { label: 'Master', key: 'master', color: '#4DABF7' },
                            { label: 'Enlightened', key: 'enlightened', color: '#91A7FF' },
                            { label: 'Burned', key: 'burned', color: '#868E96' }
                        ].map((s) => {
                            const count = stats.srsSpread?.[s.key as keyof typeof stats.srsSpread] || 0;
                            const maxCount = Math.max(...Object.values(stats.srsSpread || {}).map(v => typeof v === 'number' ? v : 0), 1);
                            const barPct = Math.round((count / maxCount) * 100);
                            return (
                                <div key={s.key} className="space-y-1 group">
                                    <div className="flex justify-between items-center px-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#3E4A61]/50">{s.label}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-[#3E4A61]">{count}</span>
                                    </div>
                                    <div className="h-2.5 bg-[#F7FAFC] rounded-xl overflow-hidden border border-border/10 p-0.5">
                                        <div
                                            className="h-full rounded-lg transition-all duration-1000"
                                            style={{ width: `${Math.max(4, barPct)}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}99)` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Forecast */}
                <div className="glass-card p-4 sm:p-6 space-y-4 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4DABF7]/30 to-transparent" />
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-[#3E4A61] tracking-tight text-left">Review Forecast</h3>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5 text-left">Upcoming load</p>
                        </div>
                        <div className="flex bg-[#F7FAFC] p-0.5 rounded-xl border border-border/20">
                            {(['hourly', 'daily'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setForecastType(t)}
                                    className={clsx(
                                        "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-300",
                                        forecastType === t ? "bg-white text-primary shadow-sm" : "text-[#A0AEC0]"
                                    )}
                                >
                                    {t === 'hourly' ? '24h' : '14d'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-h-[120px] sm:min-h-[160px] flex items-end gap-1 pb-3 overflow-x-auto no-scrollbar">
                        {(forecastType === 'hourly' ? stats.forecast?.hourly : stats.forecast?.daily)?.map((item: any, i: number) => {
                            const arr = forecastType === 'hourly' ? stats.forecast?.hourly : stats.forecast?.daily;
                            const maxCount = Math.max(...(arr || []).map((x: any) => x.count), 1);
                            const hPct = (item.count / maxCount) * 100;
                            const label = forecastType === 'hourly'
                                ? `${new Date(item.time).getHours()}h`
                                : `${new Date(item.date).getDate()}`;
                            const isNow = i === 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-[20px] group relative">
                                    <div className="flex-1 w-full flex items-end justify-center">
                                        <div
                                            className="w-2 rounded-full transition-all duration-1000"
                                            style={{
                                                height: `${Math.max(4, hPct)}%`,
                                                background: isNow ? 'linear-gradient(to top, #F4ACB7, #D88C9A)' : 'linear-gradient(to top, #EDF2F7, #E2E8F0)'
                                            }}
                                        />
                                    </div>
                                    <span className={clsx("text-[7px] font-black", isNow ? "text-primary" : "text-[#A0AEC0]")}>{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Activity Heatmap */}
            <div className="glass-card p-4 sm:p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-[#3E4A61] tracking-tight text-left">Activity</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5 text-left">52-week history</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary">
                        <TrendingUp size={12} />
                        <span className="text-[9px] font-black">100+/day</span>
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex flex-wrap gap-0.5 min-w-[280px]" style={{ maxWidth: '100%' }}>
                        {Array.from({ length: 52 * 7 }).map((_, i) => {
                            const date = HanaTime.getNow();
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
                                    title={`${dateStr}: ${count}`}
                                    className={clsx(
                                        "w-2 h-2 rounded-[2px] transition-all duration-300 hover:scale-150 cursor-crosshair",
                                        intensity === 0 && "bg-[#F7FAFC]",
                                        intensity === 1 && "bg-[#F4ACB733]",
                                        intensity === 2 && "bg-[#F4ACB766]",
                                        intensity === 3 && "bg-[#F4ACB7AA]",
                                        intensity === 4 && "bg-primary shadow-[0_0_6px_rgba(244,172,183,0.4)]"
                                    )}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[7px] font-black text-[#CBD5E0] uppercase tracking-widest leading-none">Less Active</span>
                    <div className="flex gap-1 items-center">
                        {[0, 1, 2, 3, 4].map(idx => (
                            <div key={idx} className={clsx("w-2 h-2 rounded-[2px]",
                                idx === 0 && "bg-[#F7FAFC]",
                                idx === 1 && "bg-[#F4ACB733]",
                                idx === 2 && "bg-[#F4ACB766]",
                                idx === 3 && "bg-[#F4ACB7AA]",
                                idx === 4 && "bg-primary"
                            )} />
                        ))}
                    </div>
                    <span className="text-[7px] font-black text-[#CBD5E0] uppercase tracking-widest leading-none">Most Active</span>
                </div>
            </div>
        </main>
    );
}
