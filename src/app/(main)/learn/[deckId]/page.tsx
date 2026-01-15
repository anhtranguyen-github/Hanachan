
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import {
    ChevronLeft,
    BarChart3,
    PieChart,
    Settings,
    Play,
    Clock,
    Flame,
    Activity,
    Calendar,
    Layers,
    Info,
    CheckCircle2,
    Target,
    BookOpen,
    Shapes,
    Search,
    Type,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';

export default function DeckDetailsPage() {
    const { deckId } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [deck, setDeck] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && deckId) {
            async function loadData() {
                const decks = await MockDB.getUserDecks(user!.id);
                const currentDeck = decks.find(d => d.id === deckId);
                setDeck(currentDeck);

                const progress = await MockDB.getDeckProgress(user!.id, deckId as string);
                setStats(progress);
                setLoading(false);
            }
            loadData();
        }
    }, [user, deckId]);

    if (loading) return <div className="p-12 animate-pulse text-center font-black">Analyzing Deck...</div>;
    if (!deck) return <div className="p-12 text-center font-black">Deck not found.</div>;

    return (
        <div className="flex flex-col gap-10 pb-20 max-w-6xl mx-auto">
            <header className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/learn')}
                    className="flex items-center gap-2 font-black text-primary-dark/40 hover:text-primary transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Decks
                </button>
                <div className="flex gap-2">
                    <button className="w-10 h-10 clay-card p-0 flex items-center justify-center hover:bg-primary/5">
                        <Settings className="w-5 h-5 text-primary-dark/40" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* 1. Sidebar Composition & Info */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <section className="clay-card p-8 bg-white flex flex-col items-center text-center gap-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-clay border-2 border-primary-dark flex items-center justify-center text-primary shadow-clay">
                            <Layers className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-primary-dark tracking-tight">{deck.name}</h1>
                            <p className="text-sm font-bold text-primary-dark/50 mt-2 line-clamp-2">{deck.description}</p>
                        </div>

                        <div className="w-full flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-background p-4 rounded-clay border-2 border-primary-dark shadow-inset">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40">Completion</span>
                                <span className="text-lg font-black text-primary">{stats.coverage}%</span>
                            </div>
                        </div>

                        {/* Deck Composition Chart */}
                        <div className="w-full flex flex-col gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-dark/40">Deck Composition</h3>
                            <div className="w-full h-8 flex rounded-clay border-2 border-primary-dark overflow-hidden shadow-clay-sm">
                                <div className="bg-primary h-full" style={{ width: `${stats.composition.vocab}%` }} title="Vocab" />
                                <div className="bg-secondary h-full" style={{ width: `${stats.composition.kanji}%` }} title="Kanji" />
                                <div className="bg-primary-dark h-full" style={{ width: `${stats.composition.radical}%` }} title="Radicals" />
                            </div>
                            <div className="flex justify-between text-[8px] font-black uppercase opacity-60 px-1">
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> {stats.composition.vocab}% Vocab</div>
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-secondary rounded-full" /> {stats.composition.kanji}% Kanji</div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/learn/${deckId}/session`)}
                            className="clay-btn w-full py-4 text-lg bg-primary mt-4"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Launch Session
                        </button>
                    </section>

                    <section className="clay-card p-8 bg-white border-dashed">
                        <h3 className="text-xs font-black text-primary-dark uppercase flex items-center gap-2 mb-6">
                            <Target className="w-4 h-4 text-primary" />
                            Flashcard Distribution
                        </h3>
                        <div className="flex flex-col gap-4">
                            {Object.entries(stats.flashcardTypes).map(([type, count]: [string, any]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Type className="w-3 h-3 text-primary-dark/30" />
                                        <span className="text-xs font-bold text-primary-dark/60 capitalize">{type}s</span>
                                    </div>
                                    <span className="text-xs font-black text-primary-dark">{count}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* 2. Main Analytics & Trends */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Mastery Levels Grid */}
                    <section className="clay-card p-8 bg-white h-fit">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-primary-dark flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-primary" />
                                Mastery Profile
                            </h3>
                            <button className="text-[10px] font-black uppercase text-primary">Global Benchmark: N5</button>
                        </div>

                        <div className="flex items-end justify-between h-32 gap-3 mb-6 px-2">
                            {stats.masteryLevels.map((lvl: number, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className={clsx(
                                            "w-full rounded-t-sm border-x border-t border-primary-dark/10 transition-all",
                                            lvl >= 3 ? "bg-primary" : lvl === 2 ? "bg-secondary" : "bg-primary-dark/10"
                                        )}
                                        style={{ height: `${(lvl / 4) * 100}%` }}
                                    />
                                    <span className="text-[8px] font-black opacity-30">C{i + 1}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-primary-dark/40 text-center italic">Aggregate stability levels across all knowledge units in this deck.</p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sentence Coverage */}
                        <section className="clay-card p-6 bg-white border-dashed relative overflow-hidden">
                            <div className="absolute right-[-10px] top-[-10px] opacity-5">
                                <Search className="w-24 h-24" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary-dark/40 mb-6">Sentence Association</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span>Primary Examples</span>
                                        <span>{stats.sentenceCoverage.primary}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-primary/10 border border-primary-dark/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${stats.sentenceCoverage.primary}%` }} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span>Context Mining</span>
                                        <span>{stats.sentenceCoverage.secondary}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-secondary/10 border border-primary-dark/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary" style={{ width: `${stats.sentenceCoverage.secondary}%` }} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-primary-dark/30 mt-4 leading-relaxed">Percentage of deck units currently associated with native example sentences.</p>
                        </section>

                        {/* Learning State Funnel */}
                        <section className="clay-card p-6 bg-primary-dark text-white flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Learning Funnel</h3>
                                <Shapes className="w-4 h-4 opacity-40" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <FunnelRow label="New" count={stats.new} total={stats.total} color="bg-white/10" />
                                <FunnelRow label="Learning" count={stats.learning} total={stats.total} color="bg-primary" />
                                <FunnelRow label="Review" count={stats.due} total={stats.total} color="bg-secondary" />
                                <FunnelRow label="Burned" count={stats.burned} total={stats.total} color="bg-white/40" />
                            </div>
                        </section>
                    </div>

                    {/* FSRS Learning Curve Simulation (Concept) */}
                    <section className="clay-card p-8 bg-white border-2 border-primary-dark overflow-hidden relative group">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-primary-dark flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Retention Projection
                            </h3>
                            <div className="flex gap-2">
                                <div className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black rounded border border-primary/20 uppercase">94% Target</div>
                            </div>
                        </div>

                        <div className="h-40 flex items-end gap-1 px-4 relative">
                            {/* SVG Curve overlay */}
                            <svg className="absolute inset-0 w-full h-full p-6 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity" preserveAspectRatio="none">
                                <path
                                    d="M 0 100 Q 50 0 100 80"
                                    vectorEffect="non-scaling-stroke"
                                    fill="none" stroke="#0D9488" strokeWidth="3" strokeDasharray="5,5"
                                />
                            </svg>
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className="flex-1 bg-primary-dark/5 rounded-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between text-[10px] font-black text-primary-dark/30 uppercase tracking-widest">
                            <span>Today</span>
                            <span>Projected Stability Curve (Next 30 Days)</span>
                            <span>Day 30</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FunnelRow({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] font-black px-1 uppercase scale-90 origin-left">
                <span>{label}</span>
                <span className="opacity-60">{count}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={clsx("h-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

