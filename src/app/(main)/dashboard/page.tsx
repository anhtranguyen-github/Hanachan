
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import {
    Flame,
    Calendar,
    Target,
    ArrowRight,
    BookOpen,
    Zap,
    TrendingUp,
    Activity,
    Award,
    Clock,
    CheckCircle2,
    ChevronRight,
    LucideIcon,
    PieChart,
    BarChart3,
    History,
    Sparkles,
    MousePointer2,
    Layers,
    Filter
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function DashboardPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (user) {
            MockDB.fetchUserDashboardStats(user.id).then(setStats);
        }
    }, [user]);

    if (!stats) return <div className="p-12 animate-pulse text-center font-black">Loading your stats...</div>;

    const maxForecast = Math.max(...stats.forecast.map((f: any) => f.count), 1);
    const maxDaily = Math.max(...stats.dailyReviews, 1);

    return (
        <div className="flex flex-col gap-10 pb-20">
            {/* Executive Summary */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Okaeri, {user?.user_metadata?.display_name}! 👋</h1>
                    <p className="text-primary-dark opacity-70 font-bold mt-2">Retention is holding steady at <span className="text-primary">{stats.retention * 100}%</span> this week.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-5 py-3 bg-white border-2 border-primary-dark rounded-clay shadow-clay flex items-center gap-3">
                        <Activity className="w-5 h-5 text-primary" />
                        <span className="font-black text-primary-dark text-sm">Active Habit</span>
                    </div>
                </div>
            </header>

            {/* Global Mastery & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Global Activity Heatmap */}
                <section className="lg:col-span-2 clay-card p-8 bg-white overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-primary-dark flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Activity Heatmap
                        </h2>
                        <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black text-primary-dark/30 uppercase mr-1">Less</span>
                            {[0, 1, 2, 3, 4].map(v => (
                                <div key={v} className={clsx("w-3 h-3 rounded-sm", v === 0 ? "bg-primary-dark/5" : v === 1 ? "bg-primary/20" : v === 2 ? "bg-primary/50" : v === 3 ? "bg-primary" : "bg-primary-dark")} />
                            ))}
                            <span className="text-[8px] font-black text-primary-dark/30 uppercase ml-1">More</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-between">
                        {stats.heatmap.slice(0, 364).map((v: number, i: number) => (
                            <div
                                key={i}
                                className={clsx(
                                    "w-3.5 h-3.5 rounded-sm transition-all hover:scale-150 cursor-help",
                                    v === 0 ? "bg-primary-dark/5" : v === 1 ? "bg-primary/20" : v === 2 ? "bg-primary/50" : v === 3 ? "bg-primary" : "bg-primary-dark"
                                )}
                                title={`Intensity Level: ${v}`}
                            />
                        ))}
                    </div>
                    <div className="mt-6 flex justify-between text-[10px] font-black text-primary-dark/30 uppercase tracking-[0.2em]">
                        <span>Jan 2025</span>
                        <span>May 2025</span>
                        <span>Sep 2025</span>
                        <span>Dec 2025</span>
                    </div>
                </section>

                {/* 2. Knowledge Type Mastery Funnel */}
                <section className="clay-card p-8 bg-primary-dark text-white flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <Layers className="w-48 h-48" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest relative z-10">Content Mastery</h2>
                    <div className="flex flex-col gap-4 relative z-10">
                        {Object.entries(stats.typeMastery).map(([type, value]: [string, any]) => (
                            <div key={type} className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                    <span>{type}</span>
                                    <span>{value}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-white/10 rounded-full border border-white/20 overflow-hidden">
                                    <div
                                        className={clsx("h-full transition-all duration-1000", type === 'radical' ? "bg-secondary" : "bg-primary")}
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-bold opacity-40 italic mt-auto">Global coverage: {stats.totalKUCoverage.toFixed(1)}% of curriculum</p>
                </section>
            </div>

            {/* FSRS Learning Dynamics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Reviews Due */}
                <div className="clay-card p-6 bg-white border-primary flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Reviews Due</span>
                        <Zap className="w-5 h-5 text-primary fill-current" />
                    </div>
                    <div className="text-5xl font-black text-primary-dark">{stats.reviewsDue}</div>
                    <Link href="/review" className="clay-btn bg-primary py-2 text-xs">Review Now</Link>
                </div>

                {/* Total Burned */}
                <div className="clay-card p-6 bg-white border-dashed flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Total Burned</span>
                        <Flame className="w-5 h-5 text-secondary fill-current" />
                    </div>
                    <div className="text-5xl font-black text-primary-dark">{stats.totalBurned}</div>
                    <p className="text-[10px] font-bold opacity-40">Items permanently memorized</p>
                </div>

                {/* Stability Dist */}
                <div className="clay-card p-6 bg-white flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Stability Profile</span>
                    <div className="flex-1 flex items-end gap-2 h-20">
                        <div className="flex-1 bg-red-100 border-2 border-red-500 rounded-clay h-[20%]" title="Low Stability" />
                        <div className="flex-1 bg-primary/20 border-2 border-primary rounded-clay h-[50%]" title="Medium Stability" />
                        <div className="flex-1 bg-secondary/20 border-2 border-secondary rounded-clay h-[30%]" title="High Stability" />
                    </div>
                    <div className="flex justify-between text-[8px] font-black opacity-40">
                        <span>L</span>
                        <span>M</span>
                        <span>H</span>
                    </div>
                </div>

                {/* Difficulty Dist */}
                <div className="clay-card p-6 bg-white flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Difficulty Spread</span>
                    <div className="flex-1 flex items-end gap-2 h-20">
                        <div className="flex-1 bg-gray-100 border-2 border-gray-400 rounded-clay h-[40%]" title="Easy" />
                        <div className="flex-1 bg-primary/20 border-2 border-primary rounded-clay h-[45%]" title="Normal" />
                        <div className="flex-1 bg-red-100 border-2 border-red-500 rounded-clay h-[15%]" title="Hard" />
                    </div>
                    <div className="flex justify-between text-[8px] font-black opacity-40">
                        <span>EZ</span>
                        <span>OK</span>
                        <span>HD</span>
                    </div>
                </div>
            </div>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Daily Review Counts (Last 7 Days) */}
                <section className="clay-card p-8 bg-white border-dashed">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-xl font-black text-primary-dark flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            Processing Trends
                        </h2>
                        <span className="text-[10px] font-black uppercase text-primary-dark/30">Last 7 Sessions</span>
                    </div>
                    <div className="flex items-end justify-between h-40 gap-4">
                        {stats.dailyReviews.map((v: number, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/10 group-hover:bg-primary transition-all border-x-2 border-t-2 border-primary-dark rounded-t-clay relative overflow-hidden"
                                    style={{ height: `${(v / maxDaily) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </div>
                                <span className="text-[10px] font-black opacity-40 uppercase">Day {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Review Forecast (Next 7 Days) */}
                <section className="clay-card p-8 bg-white overflow-hidden relative">
                    <div className="absolute right-4 top-4 p-2 bg-secondary/10 rounded-full border border-secondary/20">
                        <TrendingUp className="w-5 h-5 text-secondary" />
                    </div>
                    <h2 className="text-xl font-black text-primary-dark mb-10">Capacity Forecast</h2>
                    <div className="flex items-end justify-between h-40 gap-4">
                        {stats.forecast.map((f: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-secondary/10 group-hover:bg-secondary transition-all border-x-2 border-t-2 border-primary-dark rounded-t-clay"
                                    style={{ height: `${(f.count / maxForecast) * 100}%` }}
                                />
                                <span className="text-[10px] font-black opacity-40 uppercase">D{i}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Behavioral Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Analyzer Usage', value: stats.actionFrequencies.analyze, icon: MousePointer2, color: 'text-primary' },
                    { label: 'Flashcards Linked', value: stats.actionFrequencies.flashcard, icon: History, color: 'text-secondary' },
                    { label: 'SRS Reviews', value: stats.actionFrequencies.srs, icon: Sparkles, color: 'text-primary' },
                ].map((item, i) => (
                    <div key={i} className="clay-card p-6 bg-white flex flex-col items-center justify-center text-center gap-4 group hover:-translate-y-2 transition-all">
                        <div className={clsx("w-12 h-12 rounded-clay border-2 border-primary-dark flex items-center justify-center shadow-clay", item.color)}>
                            <item.icon className="w-6 h-6 " />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-primary-dark">{item.value}</div>
                            <div className="text-[10px] font-black uppercase opacity-40 tracking-widest">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
