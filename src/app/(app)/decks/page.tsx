'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { Play, Search, Filter, BookOpen, Layers, Plus } from 'lucide-react';
import { PageHeader } from '@/ui/components/PageHeader';
import { cn } from '@/lib/utils';
import { fetchCurriculumStats } from '@/features/srs/service';

export default function DecksPage() {
    const router = useRouter();
    const [levelStats, setLevelStats] = useState<Record<number, number>>({});

    // Generate 60 Official Levels
    const levels = Array.from({ length: 60 }, (_, i) => i + 1);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const stats = await fetchCurriculumStats();
            setLevelStats(stats);
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <PageHeader
                title="Curriculum & Decks"
                subtitle="Master the 60 levels of Japanese"
                icon={Layers}
                iconColor="text-rose-500"
                action={
                    <div className="flex gap-4">
                        <Button className="rounded-full px-6 bg-rose-500 hover:bg-rose-600 font-bold text-white shadow-lg shadow-rose-200">
                            <Plus className="w-4 h-4 mr-2" /> CREATE DECK
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input className="pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none w-64 shadow-sm h-10" placeholder="Search decks..." />
                        </div>
                    </div>
                }
            />

            {/* Deck Filters */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                <button className="text-sm font-bold text-rose-500 border-b-2 border-rose-500 pb-2 px-2">Official Levels</button>
                <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-2 px-2">Custom Decks</button>
                <div className="ml-auto">
                    <Button variant="ghost" size="sm" className="text-slate-500 font-bold">
                        <Filter className="w-4 h-4 mr-2" /> Sort By
                    </Button>
                </div>
            </div>

            {/* Official Levels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levels.map((level) => (
                    <div key={level} className="app-card p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-100 cursor-pointer"
                        onClick={() => router.push(`/decks/level-${level}`)}>

                        {/* Level Header Strip */}
                        <div className={cn("h-3",
                            level <= 10 ? "bg-blue-400" :
                                level <= 20 ? "bg-cyan-400" :
                                    level <= 30 ? "bg-emerald-400" :
                                        level <= 40 ? "bg-amber-400" :
                                            level <= 50 ? "bg-orange-400" : "bg-rose-500"
                        )}></div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={cn("px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-100 text-slate-500")}>
                                        OFFICIAL
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-800 mt-2">Level {level}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:bg-rose-50 transition-colors">
                                    <span className="font-black text-lg">{level}</span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 leading-relaxed">
                                Core Kanji and Vocabulary for Level {level}.
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-xs font-bold text-slate-400">{levelStats[level] ? `${levelStats[level]} items` : 'Loading...'}</span>
                                <Button size="sm" className="h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white font-bold text-xs"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/study/level-${level}`) }}>
                                    <Play size={12} className="mr-1" /> Study
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
