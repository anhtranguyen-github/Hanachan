
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockDB } from '@/lib/mock-db';
import {
    ChevronLeft,
    BookOpen,
    Info,
    Layers,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    Flame,
    Plus
} from 'lucide-react';
import { clsx } from 'clsx';

export default function GrammarDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            MockDB.fetchItemDetails('grammar', `grammar/${decodeURIComponent(slug as string)}`).then(res => {
                setItem(res);
                setLoading(false);
            });
        }
    }, [slug]);

    if (loading) return <div className="p-12 animate-pulse text-center font-black">Loading Grammar...</div>;
    if (!item) return <div className="p-12 text-center font-black">Grammar not found.</div>;

    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 font-black text-primary-dark/40 hover:text-primary transition-colors w-fit"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Library
            </button>

            {/* Hero Header */}
            <section className="clay-card p-10 bg-primary/5 flex flex-col items-center text-center gap-4">
                <div className="px-4 py-1 bg-primary text-white text-xs font-black rounded-full border-2 border-primary-dark shadow-clay mb-2">
                    JLPT N5
                </div>
                <h1 className="text-6xl font-black text-primary-dark tracking-tight">{item.character}</h1>
                <p className="text-2xl font-black text-primary capitalize">{item.meaning}</p>
                <p className="max-w-2xl text-primary-dark/60 font-bold mt-4 leading-relaxed">
                    {item.ku_grammar?.details || 'This grammar point is used to express reasons or subjective explanations.'}
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-8">
                    <section className="clay-card p-8 bg-white h-fit">
                        <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-primary" />
                            Construction
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-background border-2 border-primary-dark rounded-[24px]">
                                <div className="text-xs font-black uppercase text-primary-dark/40 mb-2">Structure</div>
                                <div className="text-xl font-black text-primary-dark flex items-center gap-2">
                                    <span className="bg-primary/10 px-2 py-1 rounded border-2 border-primary/20">Verb (Plain)</span>
                                    <Plus className="w-4 h-4 text-primary-dark/40" />
                                    <span className="text-primary">{item.character}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-background border-2 border-primary-dark rounded-[24px]">
                                <div className="text-xs font-black uppercase text-primary-dark/40 mb-2">Example</div>
                                <div className="text-lg font-bold text-primary-dark">
                                    行く + <span className="text-primary">{item.character}</span> → 行く{item.character}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="clay-card p-8 bg-white h-fit border-dashed">
                        <h3 className="text-xl font-black text-primary-dark mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-secondary" />
                            Usage Note
                        </h3>
                        <div className="p-4 bg-secondary/5 rounded-clay border-2 border-primary-dark text-sm font-bold text-primary-dark/80 leading-relaxed italic">
                            {item.ku_grammar?.cautions || 'Be careful when using this in formal situations. It can sound a bit informal or insistent.'}
                        </div>
                    </section>
                </div>

                <div className="flex flex-col gap-8">
                    <section className="clay-card p-8 bg-primary-dark text-white border-primary-dark flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-clay flex items-center justify-center border-2 border-white/20">
                                <Flame className="w-6 h-6 text-white fill-current" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg">Mastery Session</h3>
                                <p className="text-xs font-bold opacity-70">Focus on {item.character} to level up</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-black uppercase opacity-60">
                                <span>Coverage</span>
                                <span>42%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full border border-white/20 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '42%' }} />
                            </div>
                        </div>

                        <button className="clay-btn bg-white !text-primary-dark w-full py-4 text-lg">
                            Start Focused Drill
                        </button>
                    </section>

                    <section className="clay-card p-8 bg-white h-full">
                        <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            Review Phrases
                        </h3>
                        <div className="flex flex-col gap-4">
                            {[
                                '行きたい{item.character}',
                                '食べるときに{item.character}',
                                '知らなかった{item.character}'
                            ].map((phrase, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-background border-2 border-primary-dark rounded-clay group cursor-pointer hover:bg-primary/5 transition-colors">
                                    <div className="w-6 h-6 bg-white border border-primary-dark/10 rounded font-black text-[10px] flex items-center justify-center">{i + 1}</div>
                                    <div className="font-bold text-primary-dark truncate">{phrase.replace('{item.character}', item.character)}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
