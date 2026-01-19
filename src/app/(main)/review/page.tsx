
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import {
    Flame,
    Zap,
    Target,
    BarChart3,
    Play,
    ChevronRight,
    TrendingUp,
    CheckCircle2,
    Calendar,
    Brain
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function ReviewPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [decks, setDecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            async function loadData() {
                const dashboardStats = await MockDB.fetchUserDashboardStats(user!.id);
                setStats(dashboardStats);

                const userDecks = await MockDB.getUserDecks(user!.id);
                const enriched = await Promise.all(userDecks.map(async (d) => {
                    const progress = await MockDB.getDeckProgress(user!.id, d.id);
                    return { ...d, stats: progress };
                }));
                // Filter only decks that have reviews due
                setDecks(enriched);
                setLoading(false);
            }
            loadData();
        }
    }, [user]);

    if (loading) return <div className="p-12 animate-pulse text-center font-black italic">Calculating your cognitive load...</div>;

    const totalDue = stats.reviewsDue;

    return (
        <div className="flex flex-col gap-10 pb-20 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-center md:text-left">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Review Center</h1>
                    <p className="text-primary-dark/60 font-bold mt-2">Strengthen your long-term memory with evidence-based spaced repetition.</p>
                </div>
            </header>

            {/* Quick Review All Section */}
            <section className="relative">
                <div className={clsx(
                    "clay-card p-10 bg-primary-dark text-white overflow-hidden relative group transition-all",
                    totalDue > 0 ? "hover:scale-[1.01] hover:shadow- clay-lg" : "opacity-80"
                )}>
                    {/* Background Decorations */}
                    <div className="absolute right-[-40px] top-[-40px] opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Brain className="w-80 h-80" />
                    </div>
                    <div className="absolute left-10 bottom-[-20px] opacity-5">
                        <Zap className="w-40 h-40" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex flex-col items-center md:items-start">
                            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-2">Cognitive Pipeline</span>
                            <div className="flex items-baseline gap-4">
                                <span className="text-7xl font-black">{totalDue}</span>
                                <span className="text-xl font-bold opacity-60 uppercase">Items Due</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            <Link
                                href={totalDue > 0 ? "/review/session" : "#"}
                                className={clsx(
                                    "clay-btn bg-primary !text-white text-xl py-6 px-12 flex items-center justify-center gap-3 shadow-clay-lg group",
                                    totalDue === 0 && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                                Review All Now
                            </Link>
                            <p className="text-[10px] font-black text-center opacity-40 uppercase tracking-widest">
                                Estimated time: {Math.ceil(totalDue * 0.5)} minutes
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 1. Deck Specific Reviews */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-black text-primary-dark uppercase tracking-widest">Focus Areas</h2>
                        <div className="h-1 flex-1 bg-primary-dark/5 rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {decks.filter(d => d.stats.due > 0).map((deck) => (
                            <div key={deck.id} className="clay-card p-6 bg-white hover:-translate-y-1 transition-all flex flex-col justify-between gap-4 border-dashed">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-1 rounded-full uppercase border border-primary/20">
                                            {deck.deck_type === 'system' ? 'Official' : 'Custom'}
                                        </span>
                                        <span className="text-lg font-black text-red-500">{deck.stats.due}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-primary-dark line-clamp-1">{deck.name}</h3>
                                </div>
                                <Link
                                    href={`/decks/${deck.id}/session`}
                                    className="clay-btn bg-white !text-primary-dark hover:bg-primary/5 py-3 text-xs border-primary shadow-none flex items-center justify-center gap-2 group"
                                >
                                    Review This Deck
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        ))}
                    </div>

                    {decks.filter(d => d.stats.due > 0).length === 0 && (
                        <div className="clay-card p-12 bg-primary/5 border-dashed flex flex-col items-center justify-center text-center gap-4">
                            <CheckCircle2 className="w-12 h-12 text-primary opacity-20" />
                            <p className="font-bold text-primary-dark/40 italic">Incredible! Your review queue is empty.</p>
                            <Link href="/decks" className="text-primary font-black uppercase text-xs hover:underline">Go learn something new &rarr;</Link>
                        </div>
                    )}
                </div>

                {/* 2. Review Stats & Forecast */}
                <div className="flex flex-col gap-8">
                    <section className="clay-card p-8 bg-white flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-primary-dark text-lg">Retention</h3>
                            <TrendingUp className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-black text-primary-dark">{(stats.retention * 100).toFixed(0)}%</div>
                            <div className="flex-1 h-2 bg-primary-dark/10 rounded-full overflow-hidden">
                                <div className="h-full bg-secondary" style={{ width: `${stats.retention * 100}%` }} />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-primary-dark/40 leading-relaxed italic border-l-4 border-secondary/20 pl-4">
                            You're staying above your target retention of 90%. Keep this rhythm!
                        </p>
                    </section>

                    <section className="clay-card p-8 bg-white border-dashed">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest">7-Day Forecast</h3>
                            <Calendar className="w-4 h-4 opacity-20" />
                        </div>
                        <div className="flex items-end justify-between h-24 gap-2">
                            {stats.forecast.map((f: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-primary/20 group-hover:bg-primary transition-all rounded-t-sm"
                                        style={{ height: `${(f.count / Math.max(...stats.forecast.map((d: any) => d.count), 1)) * 100}%` }}
                                    />
                                    <span className="text-[6px] font-black opacity-30">D{i}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

