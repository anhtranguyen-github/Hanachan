'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { Play, ChevronRight, BarChart3, Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/ui/components/PageHeader';
import { useUser } from '@/features/auth/AuthContext';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useUser();

    if (loading) {
        return <div className="max-w-6xl mx-auto p-20 text-center animate-pulse text-slate-400 font-bold">Loading your journey...</div>;
    }

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Explorer';

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            <PageHeader
                title={`Welcome back, ${displayName}!`}
                subtitle="Ready to continue your journey?"
                action={
                    <div className="flex gap-3">
                        <Button className="rounded-full px-6 bg-rose-500 hover:bg-rose-600 font-bold text-white shadow-lg shadow-rose-200" onClick={() => router.push('/dashboard/level-25')}>
                            <Play className="w-4 h-4 mr-2" /> CONTINUE STUDY
                        </Button>
                        <Button variant="outline" className="rounded-full px-6 border-slate-300 font-bold text-slate-600 hover:bg-slate-50">
                            <Plus className="w-4 h-4 mr-2" /> CREATE DECK
                        </Button>
                    </div>
                }
            />

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="app-card p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-rose-50 to-white">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Daily Streak</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">5</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">days</span>
                    </div>
                </div>
                <div className="app-card p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-blue-50 to-white">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Cards Learned</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">342</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">cards</span>
                    </div>
                </div>
                <div className="app-card p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-purple-50 to-white">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Reviews Due</span>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-slate-900">18</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">cards</span>
                    </div>
                </div>
            </div>

            {/* Decks Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Decks</h3>
                    <Link href="/decks" className="text-xs font-bold text-rose-500 hover:text-rose-600">View All</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Deck 1 - The Mock Deck from Screenshot */}
                    <div className="app-card p-0 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-rose-100" onClick={() => router.push('/dashboard/level-25')}>
                        <div className="h-32 bg-rose-50 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-100 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <span className="px-2 py-1 bg-white/80 text-rose-500 text-[10px] font-black uppercase rounded mb-2 inline-block">JLPT N5</span>
                                <h3 className="text-2xl font-black text-slate-800">Level 25</h3>
                            </div>
                            <div className="relative z-10 text-xs font-bold text-slate-500">10 cards due</div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 border border-white"></div>
                                <div className="w-2 h-2 rounded-full bg-sky-400 border border-white"></div>
                                <div className="w-2 h-2 rounded-full bg-amber-400 border border-white"></div>
                            </div>
                            <Button size="sm" className="h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white font-bold text-xs" onClick={(e) => { e.stopPropagation(); router.push('/dashboard/level-25') }}>
                                <Play size={12} className="mr-1" /> Study
                            </Button>
                        </div>
                    </div>

                    {/* Deck 2 */}
                    <div className="app-card p-0 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-100">
                        <div className="h-32 bg-blue-50 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-100 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-slate-800">Core 2K/6K</h3>
                            </div>
                            <div className="relative z-10 text-xs font-bold text-slate-500">5 cards due</div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full w-[45%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Deck 3 */}
                    <div className="app-card p-0 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-purple-100">
                        <div className="h-32 bg-purple-50 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-100 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-slate-800">YouTube Mining</h3>
                            </div>
                            <div className="relative z-10 text-xs font-bold text-slate-500">0 cards due</div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="text-xs text-slate-400 font-bold">All caught up!</div>
                        </div>
                    </div>
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
                            <h3 className="font-bold text-lg">Deck Activity Heatmap</h3>
                            <p className="text-xs text-slate-500">Frequency of studies and reviews over time</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl">
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Flips</div>
                        <div className="text-2xl font-black text-slate-800">1250</div>
                    </div>
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Flips/Day</div>
                        <div className="text-2xl font-black text-slate-800">42</div>
                    </div>
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Known</div>
                        <div className="text-2xl font-black text-emerald-500">156</div>
                    </div>
                    <div className="text-center border-r border-slate-200 last:border-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Words/Day</div>
                        <div className="text-2xl font-black text-emerald-500">5.2</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
