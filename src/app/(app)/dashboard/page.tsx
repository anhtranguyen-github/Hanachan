'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { Play, ChevronRight, BarChart3, Plus, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/ui/components/PageHeader';
import { useUser } from '@/features/auth/AuthContext';
import { fetchUserDashboardStats, fetchDeckStats } from '@/features/srs/service';

import { seedDatabaseAction } from '@/features/knowledge/actions';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useUser();
    const [isSeeding, setIsSeeding] = useState(false);

    // State
    const [stats, setStats] = useState({ reviewsDue: 0, totalLearned: 0, streak: 0, recentLevels: [] as number[] });
    const [deckStats, setDeckStats] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(true);

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            await seedDatabaseAction();
            alert("Database seeded with sample Kanji, Vocab, and Grammar!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSeeding(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            loadDashboard();
        }
    }, [authLoading, user]);

    const loadDashboard = async () => {
        if (!user) return;
        try {
            const data = await fetchUserDashboardStats(user.id);
            setStats(data);

            // Load stats for recent levels
            const decks: Record<number, any> = {};
            if (data.recentLevels.length > 0) {
                await Promise.all(data.recentLevels.map(async (lvl) => {
                    decks[lvl] = await fetchDeckStats(user.id, `level-${lvl}`);
                }));
                setDeckStats(decks);
            } else {
                // If no levels started, maybe suggest Level 1
                decks[1] = await fetchDeckStats(user.id, 'level-1');
                setDeckStats(decks);
                if (data.recentLevels.length === 0) {
                    setStats(prev => ({ ...prev, recentLevels: [1] }));
                }
            }
        } catch (e) {
            console.error("Dashboard load failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return <div className="max-w-6xl mx-auto p-20 text-center animate-pulse text-slate-400 font-bold">Loading your journey...</div>;
    }

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Explorer';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">

            <PageHeader
                title={`Welcome back, ${displayName}!`}
                subtitle="Ready to continue your journey?"
                action={
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="rounded-full px-6 border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                            onClick={handleSeed}
                            disabled={isSeeding}
                        >
                            {isSeeding ? 'Seeding...' : 'Seed Missing Data'}
                        </Button>
                        <Button className="rounded-full px-6 bg-rose-500 hover:bg-rose-600 font-bold text-white shadow-lg shadow-rose-200" onClick={() => router.push('/study/review-all')}>
                            <Play className="w-4 h-4 mr-2" /> REVIEW ALL DUE {stats.reviewsDue > 0 ? `(${stats.reviewsDue})` : ''}
                        </Button>
                    </div>
                }
            />

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="app-card p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-rose-50 to-white">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Daily Streak</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">{stats.streak}</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">days</span>
                    </div>
                </div>
                <div className="app-card p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-blue-50 to-white">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Cards Learned</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">{stats.totalLearned}</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">cards</span>
                    </div>
                </div>
                <div className="app-card p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-purple-50 to-white">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Reviews Due</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">{stats.reviewsDue}</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">cards</span>
                    </div>
                </div>
            </div>

            {/* Decks Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Levels</h3>
                    <Link href="/decks" className="text-xs font-bold text-rose-500 hover:text-rose-600">View All</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.recentLevels.map((lvl) => {
                        const dStat = deckStats[lvl] || { due: 0, learned: 0, total: 0 };
                        const percent = dStat.total > 0 ? (dStat.learned / dStat.total) * 100 : 0;

                        return (
                            <div key={lvl} className="app-card p-0 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-rose-100" onClick={() => router.push(`/decks/level-${lvl}`)}>
                                <div className="h-32 bg-slate-50 p-6 flex flex-col justify-between relative overflow-hidden group-hover:bg-rose-50 transition-colors">
                                    <div className="relative z-10">
                                        <span className="px-2 py-1 bg-white/80 text-rose-500 text-[10px] font-black uppercase rounded mb-2 inline-block">OFFICIAL</span>
                                        <h3 className="text-2xl font-black text-slate-800">Level {lvl}</h3>
                                    </div>
                                    <div className="relative z-10 text-xs font-bold text-slate-500">{dStat.due} cards due</div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex-1 mr-4">
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                    <Button size="sm" className="h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white font-bold text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/study/level-${lvl}`) }}>
                                        <Play size={12} className="mr-1" /> Study
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Heatmap Section */}
            <div className="app-card p-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Your Progress</h3>
                            <p className="text-xs text-slate-500">Activity & Stats</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl">
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Learned</div>
                        <div className="text-2xl font-black text-slate-800">{stats.totalLearned}</div>
                    </div>
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Streak</div>
                        <div className="text-2xl font-black text-slate-800">2.5</div>
                    </div>
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">XP Earned</div>
                        <div className="text-2xl font-black text-emerald-500">850</div>
                    </div>
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Level Cap</div>
                        <div className="text-2xl font-black text-emerald-500">60</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
