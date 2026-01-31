'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
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
                    percentage: Math.round((levelStats.mastered / Math.max(levelStats.total, 1)) * 100),
                    passed: levelStats.mastered,
                    total: levelStats.total,
                }
            });
        } catch (error) {
            console.error("Failed to refresh dashboard data:", error);
            // Fallback to prevent infinite loading
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
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-1000" data-testid="dashboard-root">
            {/* Header Area */}
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Konnichiwa, {user?.user_metadata?.display_name || 'Learner'}!
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">
                            Mastery Level {userLevel}
                        </span>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    {/* Streak Counter - Matches Demo v2 */}
                    <div className="bg-orange-50 px-6 py-3 rounded-2xl border-2 border-orange-100 flex items-center gap-3 shadow-sm">
                        <span className="text-2xl animate-pulse">🔥</span>
                        <div>
                            <span className="block text-xl font-black text-orange-600 leading-none">{stats.streak || 0}</span>
                            <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest">Day Streak</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* SRS Summary Cluster (8 Columns) */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                    <Link href="/learn" className="group" data-testid="learn-card">
                        <div className="h-full bg-primary text-white p-8 rounded-[40px] shadow-xl shadow-primary/20 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[60px] transform group-hover:scale-110 transition-transform"></div>
                            <span className="block text-5xl font-black mb-1">{stats.new}</span>
                            <span className="text-xs font-black uppercase tracking-widest opacity-60">Lessons Available</span>
                            <div className="mt-8 flex items-center gap-2 text-xs font-bold">
                                <span>Start Discovery</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/review" className="group" data-testid="review-card">
                        <div className="h-full bg-kanji text-white p-8 rounded-[40px] shadow-xl shadow-kanji/20 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[60px] transform group-hover:scale-110 transition-transform"></div>
                            <span className="block text-5xl font-black mb-1">{stats.due}</span>
                            <span className="text-xs font-black uppercase tracking-widest opacity-60">Reviews Due</span>
                            <div className="mt-8 flex items-center gap-2 text-xs font-bold">
                                <span>Clear Queue</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white border-2 border-gray-300 p-8 rounded-[40px] flex flex-col justify-between shadow-sm">
                        <div className="space-y-1">
                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Precision</span>
                            <span className="block text-4xl font-black text-gray-900 tracking-tighter">{stats.retention}%</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${stats.retention}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accuracy Breakdown (4 Columns) - Dark Design from demo */}
                <div className="col-span-12 lg:col-span-4 bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Today's Activity</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-500">Correct Answers</span>
                            <span className="text-xl font-black text-emerald-400" data-testid="stats-correct-answers">{(stats.reviewsToday || 0) - (stats.mistakes || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-500">Mistakes</span>
                            <span className="text-xl font-black text-rose-400">{stats.mistakes || 0}</span>
                        </div>

                        <div className="pt-6 border-t border-gray-800">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Daily Target</span>
                                    <span className="text-lg font-black italic">{stats.reviewsToday} / 200 items</span>
                                </div>
                                <span className="text-xs font-bold text-primary">{Math.round((stats.reviewsToday / 200) * 100)}%</span>
                            </div>
                            <div className="h-5 bg-gray-800 rounded-2xl p-1 overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-xl shadow-[0_0_20px_rgba(244,172,183,0.5)] transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (stats.reviewsToday / 200) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Progression Detail (Full Width) */}
                <div className="col-span-12 bg-white border-2 border-gray-300 p-10 rounded-[56px] space-y-10 shadow-sm animate-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Level {userLevel} Mastery</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Complete Kanji items to unlock next stage</p>
                        </div>
                        <div className="text-right">
                            <span className="text-5xl font-black text-kanji tracking-tighter">{stats.progression.passed}</span>
                            <span className="text-2xl font-black text-gray-200"> / {stats.progression.total}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: stats.progression.total }).map((_, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "w-10 h-3 rounded-full transition-all duration-700",
                                    i < stats.progression.passed
                                        ? "bg-kanji shadow-[0_0_15px_rgba(244,172,183,0.4)]"
                                        : "bg-gray-50 border border-gray-100"
                                )}
                            />
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-kanji shadow-[0_0_5px_rgba(244,172,183,1)]"></div>
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mastered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pending</span>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-gray-200 uppercase tracking-[0.4em]">
                            Curriculum Pipeline v2 // Active
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
