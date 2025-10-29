'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, CheckCircle, GraduationCap, RefreshCw, BarChart3, ChevronRight, LayoutDashboard, Database, Zap } from 'lucide-react';
import { MasterySphere, ActivityHeatmap, BentoCard } from '@/modules/analytics/components/DashboardComponents';
import { SakuraButton } from '@/components/SakuraButton';
import { cn } from '@/lib/utils';
import { LEARNING_STATES, CONTENT_TYPES, BRAND_COLORS } from '@/config/design.config';


interface GlobalStatsData {
    stats: {
        mastered: number;
        learning: number;
        review: number;
        due: number;
        total: number;
        new?: number;
    };
    activity: Array<{ date: string; value: number; learned: number }>;
    contentProgress: Array<{ label: string; current: number; total: number }>;
    studyTimeToday: number;
    forecast: Array<{ date: string; count: number }>;
    accuracy: number;
    srsDistribution: {
        apprentice: number;
        guru: number;
        master: number;
        enlightened: number;
        burned: number;
    };
    recentMasteredDecks?: Array<{ id: string; name: string; progress: number; masteredAt: string | null; slug?: string }>;
}

export function GlobalStatsDashboard({ initialData }: { initialData: GlobalStatsData }) {
    const router = useRouter();
    const data = initialData;

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. Mastery Sphere (Primary Focus) */}
                <BentoCard
                    title="Overall Mastery"
                    subtitle="Progress through all unlocked deck items"
                    span="1"
                    className="lg:col-span-4"
                >
                    <MasterySphere
                        total={data.stats.total}
                        mastered={data.stats.mastered}
                        learning={data.stats.learning}
                        review={data.stats.review}
                    />
                </BentoCard>

                {/* 2. Top Stats Grid (Sub-Bento) */}
                <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox
                        label="Burned"
                        value={data.stats.mastered}
                        color={BRAND_COLORS.sakuraGray}
                        bgColor="#f1f5f9"
                    />
                    <StatBox
                        label="Learning"
                        value={data.stats.learning}
                        color={CONTENT_TYPES.kanji.inkColor}
                        bgColor={CONTENT_TYPES.kanji.pastelBg}
                    />
                    <StatBox
                        label="Due Today"
                        value={data.stats.due}
                        color={CONTENT_TYPES.vocabulary.inkColor}
                        bgColor={CONTENT_TYPES.vocabulary.pastelBg}
                    />
                    <StatBox
                        label="Accuracy"
                        value={`${data.accuracy}%`}
                        color="#4F46E5"
                        bgColor="#EEF2FF"
                    />

                    {/* Study Session (Double span) - SAKURA ROSE GRADIENT */}
                    <div
                        className="col-span-2 rounded-[2.5rem] p-8 text-white flex items-center justify-between relative overflow-hidden group shadow-lg shadow-sakura-rose/10"
                        style={{ background: 'linear-gradient(135deg, #5D2E37 0%, #4A3728 100%)' }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Session Duration</p>
                            <p className="text-4xl font-black tracking-tighter">
                                {Math.floor(data.studyTimeToday / 60)}m {data.studyTimeToday % 60}s
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center relative z-10 backdrop-blur-sm">
                            <Zap size={24} className="text-sakura-divider" />
                        </div>
                    </div>

                    {/* Activity Heatmap (Double span) */}
                    <div className="col-span-2">
                        <ActivityHeatmap data={data.activity} className="h-full" />
                    </div>
                </div>

                {/* 3. Mastery by Type */}
                <BentoCard
                    title="Content Distribution"
                    subtitle="Mastery breakdown by item type"
                    span="1"
                    className="lg:col-span-4"
                >
                    <div className="w-full space-y-4">
                        {data.contentProgress.map(p => {
                            const pct = p.total > 0 ? (p.current / p.total) * 100 : 0;
                            const typeKey = p.label.toLowerCase() as keyof typeof CONTENT_TYPES;
                            const contentDesign = CONTENT_TYPES[typeKey] || { inkColor: '#ec4899', pastelBg: '#fdf2f8' };

                            return (
                                <div key={p.label} className="w-full">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: contentDesign.inkColor }}>{p.label}</span>
                                        <span className="text-xs font-bold text-sakura-text-muted">{p.current}/{p.total}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: contentDesign.pastelBg }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${pct}%`, backgroundColor: contentDesign.inkColor }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </BentoCard>

                {/* 4. Recent Decks */}
                <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-sakura-divider p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black text-sakura-ink uppercase tracking-tighter">Synchronized Matrix</h3>
                            <p className="text-[10px] font-black text-sakura-cocoa/30 uppercase tracking-widest">Recent activity nodes</p>
                        </div>
                        <SakuraButton
                            variant="secondary"
                            size="sm"
                            icon={Database}
                            onClick={() => router.push('/decks')}
                        >
                            Explore All
                        </SakuraButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(data.recentMasteredDecks || []).map((deck) => (
                            <div
                                key={deck.id}
                                onClick={() => router.push(`/decks/${deck.slug || deck.id}`)}
                                className="group p-4 rounded-3xl bg-sakura-bg-soft hover:bg-white border border-transparent hover:border-sakura-divider transition-all cursor-pointer flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-lg font-black text-sakura-accent-primary group-hover:bg-sakura-accent-primary group-hover:text-white transition-all">
                                    {deck.name.match(/\d+/)?.[0] || deck.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sakura-text-primary truncate">{deck.name}</h4>
                                    <div className="h-1.5 w-full bg-white rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-sakura-accent-primary rounded-full"
                                            style={{ width: `${deck.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatBox({ label, value, color, bgColor }: { label: string, value: string | number, color: string, bgColor: string }) {
    return (
        <div className={cn("p-6 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-2 border border-sakura-divider bg-white hover:bg-sakura-bg-app transition-all group shadow-none h-full", "")}>
            <div
                className="w-1.5 h-6 rounded-full"
                style={{ backgroundColor: color }}
            />
            <div className="mt-1">
                <p className="text-2xl font-black text-sakura-ink tracking-tight">{value}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sakura-cocoa/40">{label}</p>
            </div>
        </div>
    );
}
