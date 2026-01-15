
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockDB } from '@/lib/mock-db';
import {
    ChevronLeft,
    MessageCircle,
    ExternalLink,
    Tag,
    Zap,
    Save,
    Globe,
    Layers,
    Clock,
    Volume2
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function SentenceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [sentence, setSentence] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            MockDB.getSentence(id as string).then(res => {
                setSentence(res);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <div className="p-12 animate-pulse text-center font-black">Decrypting sentence...</div>;
    if (!sentence) return <div className="p-12 text-center font-black">Sentence not found.</div>;

    const tokens = [
        { surface: '猫', meaning: 'Cat', reading: 'ねこ', type: 'kanji', id: 'kanji/日' },
        { surface: 'は', meaning: 'Particle', reading: 'は', type: 'particle' },
        { surface: '魚', meaning: 'Fish', reading: 'さかな', type: 'vocab', id: 'vocabulary/猫' },
        { surface: 'が', meaning: 'Particle', reading: 'が', type: 'particle' },
        { surface: '好き', meaning: 'Like', reading: 'すき', type: 'vocab' },
        { surface: 'です', meaning: 'Copula', reading: 'です', type: 'particle' },
    ];

    return (
        <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
            <header className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 font-black text-primary-dark/40 hover:text-primary transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Library
                </button>
                <div className="flex gap-3">
                    <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase border-2",
                        sentence.origin === 'chat' ? "bg-purple-100 text-purple-700 border-purple-500" : "bg-red-100 text-red-700 border-red-500"
                    )}>
                        {sentence.origin === 'chat' ? 'Mined from Chat' : 'Immersion Source'}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Sentence Card */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <section className="clay-card p-10 bg-white relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-primary/10">
                            <MessageCircle className="w-24 h-24" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="text-4xl md:text-5xl font-black text-primary-dark leading-relaxed">
                                {sentence.text_ja}
                            </div>
                            <div className="h-px w-full bg-primary-dark/5" />
                            <div className="text-2xl font-bold text-primary-dark opacity-60 italic">
                                “{sentence.text_en}”
                            </div>
                        </div>
                    </section>

                    {/* Breakdown */}
                    <section className="clay-card p-8 bg-white">
                        <h3 className="text-xs font-black text-primary-dark opacity-30 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            Morphological Breakdown
                        </h3>

                        <div className="flex flex-wrap gap-x-2 gap-y-10 py-6">
                            {tokens.map((token, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                                    <span className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">
                                        {token.reading}
                                    </span>
                                    {token.id ? (
                                        <Link
                                            href={`/content/${token.type}/${encodeURIComponent(token.surface)}`}
                                            className="text-3xl font-black text-primary-dark border-b-4 border-primary hover:bg-primary/5 px-1 transition-all"
                                        >
                                            {token.surface}
                                        </Link>
                                    ) : (
                                        <span className="text-3xl font-black text-primary-dark border-b-4 border-primary-dark/10 px-1">
                                            {token.surface}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-primary-dark/40">
                                        {token.meaning}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Metadata & Actions */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <section className="clay-card p-8 bg-white flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-primary-dark text-lg">Context</h3>
                            <Clock className="w-5 h-5 text-primary-dark/20" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <Globe className="w-5 h-5 text-primary mt-1" />
                                <div>
                                    <div className="text-xs font-black text-primary-dark opacity-40 uppercase">Domain</div>
                                    <div className="text-sm font-bold text-primary-dark">Conversational / Casual</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Tag className="w-5 h-5 text-secondary mt-1" />
                                <div>
                                    <div className="text-xs font-black text-primary-dark opacity-40 uppercase">Tags</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded border border-primary/20">#basicanimal</span>
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded border border-primary/20">#n5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-primary-dark/5" />

                        <div className="flex flex-col gap-3">
                            <button className="clay-btn w-full py-4 text-white bg-primary">
                                <Zap className="w-5 h-5 fill-current" />
                                Start Analyzer
                            </button>
                            <button className="clay-btn w-full py-4 bg-white !text-primary-dark border-dashed">
                                <ExternalLink className="w-5 h-5" />
                                View Source
                            </button>
                        </div>
                    </section>

                    <section className="clay-card p-6 border-dashed bg-primary/5">
                        <h3 className="text-xs font-black text-primary mb-4 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Persistence
                        </h3>
                        <p className="text-xs font-bold text-primary-dark/60 italic leading-relaxed">
                            This sentence was captured during your chat with Hana Sensei. It is saved to your immersion library for future review.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
