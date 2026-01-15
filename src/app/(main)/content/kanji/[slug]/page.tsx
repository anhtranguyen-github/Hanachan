
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockDB } from '@/lib/mock-db';
import {
    ChevronLeft,
    Volume2,
    Play,
    BookOpen,
    Info,
    Calendar,
    History,
    TrendingUp,
    BrainCircuit
} from 'lucide-react';
import { clsx } from 'clsx';

const SRS_STAGES: Record<string, { label: string, color: string }> = {
    'new': { label: 'New', color: 'bg-gray-100 text-gray-600 border-gray-300' },
    'learning': { label: 'Learning', color: 'bg-blue-100 text-blue-600 border-blue-300' },
    'review': { label: 'Review', color: 'bg-green-100 text-green-600 border-green-300' },
    'relearning': { label: 'Relearn', color: 'bg-orange-100 text-orange-600 border-orange-300' },
    'burned': { label: 'Burned', color: 'bg-purple-100 text-purple-600 border-purple-300' },
};

export default function KanjiDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            MockDB.fetchItemDetails('kanji', `kanji/${decodeURIComponent(slug as string)}`).then(res => {
                setItem(res);
                setLoading(false);
            });
        }
    }, [slug]);

    if (loading) return <div className="p-12 animate-pulse text-center font-black">Loading Kanji details...</div>;
    if (!item) return <div className="p-12 text-center font-black">Kanji not found.</div>;

    const state = item.user_learning_states || { state: 'new' };
    const stage = SRS_STAGES[state.state];

    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 font-black text-primary-dark/40 hover:text-primary transition-colors w-fit"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Library
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Card */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="clay-card p-0 overflow-hidden bg-white">
                        <div className="aspect-square flex items-center justify-center text-[180px] font-black text-primary-dark">
                            {item.character}
                        </div>
                        <div className="p-6 bg-primary/5 border-t-4 border-primary-dark">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-black uppercase text-primary tracking-widest">Meaning</span>
                                <h2 className="text-3xl font-black text-primary-dark capitalize">{item.meaning}</h2>
                            </div>
                        </div>
                    </div>

                    <div className="clay-card p-6 border-dashed bg-white">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="font-black text-primary-dark text-sm uppercase">Learning Status</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center bg-background p-3 rounded-clay border-2 border-primary-dark">
                                <span className="font-bold text-sm">Review Cycle</span>
                                <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase border-2", stage.color)}>
                                    {stage.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-background p-3 rounded-clay border-2 border-primary-dark">
                                <span className="font-bold text-sm">Next Review</span>
                                <div className="flex items-center gap-1 text-xs font-black text-primary-dark/60">
                                    <Calendar className="w-3 h-3" />
                                    {state.next_review ? new Date(state.next_review).toLocaleDateString() : 'Not scheduled'}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase text-primary-dark/40">Mastery Progress</span>
                                    <span className="text-[10px] font-black text-primary">{state.srs_stage || 0} / 5</span>
                                </div>
                                <div className="w-full h-3 bg-primary-dark/10 rounded-full border-2 border-primary-dark overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${((state.srs_stage || 0) / 5) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Info */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <section className="clay-card p-8 bg-white">
                        <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-2">
                            <Info className="w-6 h-6 text-primary" />
                            Readings & Components
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-4">
                                <div className="p-4 bg-primary/5 rounded-clay border-2 border-primary-dark">
                                    <h4 className="text-[10px] font-black uppercase text-primary mb-1">On-reading (Konyomi)</h4>
                                    <div className="text-2xl font-black text-primary-dark">
                                        {item.ku_kanji?.reading_data?.on?.join(', ') || 'None'}
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary/5 rounded-clay border-2 border-primary-dark">
                                    <h4 className="text-[10px] font-black uppercase text-secondary mb-1">Kun-reading (Kunyomi)</h4>
                                    <div className="text-2xl font-black text-primary-dark">
                                        {item.ku_kanji?.reading_data?.kun?.join(', ') || 'None'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="p-4 bg-background rounded-clay border-2 border-primary-dark border-dashed flex-1">
                                    <h4 className="text-[10px] font-black uppercase text-primary-dark/40 mb-2">Radicals</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {item.ku_radicals ? (
                                            <div className="px-3 py-1 bg-white border-2 border-primary-dark rounded-clay shadow-clay text-sm font-bold flex items-center gap-2">
                                                <span className="text-primary-dark opacity-40">#</span>
                                                {item.ku_radicals.name}
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-primary-dark/30">No radical data available</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="clay-card p-8 bg-white">
                        <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            Vocabulary using this Kanji
                        </h3>
                        <div className="flex flex-col gap-3">
                            {[
                                { word: '今日', reading: 'きょう', meaning: 'Today' },
                                { word: '明日', reading: 'あした', meaning: 'Tomorrow' },
                                { word: '日本', reading: 'にほん', meaning: 'Japan' },
                            ].map((v, i) => (
                                <div key={i} className="p-4 bg-background border-2 border-primary-dark rounded-clay flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl font-black text-primary-dark">{v.word}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-primary">{v.reading}</span>
                                            <span className="text-sm font-bold text-primary-dark/60">{v.meaning}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary-dark/20 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex gap-4">
                        <button className="clay-btn flex-1 bg-primary text-xl py-6">
                            <BrainCircuit className="w-6 h-6" />
                            Practice Now
                        </button>
                        <button className="clay-btn flex-1 bg-white !text-primary-dark border-2 text-xl py-6">
                            <History className="w-6 h-6" />
                            View History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
