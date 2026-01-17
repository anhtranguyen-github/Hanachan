
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
    Volume2,
    BookOpen
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

import { QuickViewModal, QuickViewData } from '@/components/shared/QuickViewModal';

export default function SentenceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [sentence, setSentence] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [quickViewOpen, setQuickViewOpen] = useState(false);
    const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);

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
        { surface: '猫', meaning: 'Cat', reading: 'ねこ', type: 'vocabulary', level: 'N5', explanation: 'A common domestic animal. Frequently used in beginner sentences.' },
        { surface: 'は', meaning: 'Topic Marker', reading: 'wa', type: 'particle', level: 'N5', explanation: 'Indicates the topic of the sentence.' },
        { surface: '魚', meaning: 'Fish', reading: 'さかな', type: 'vocabulary', level: 'N5', explanation: 'Aquatic animal used as food.' },
        { surface: 'が', meaning: 'Subject Marker', reading: 'ga', type: 'particle', level: 'N5' },
        { surface: '好き', meaning: 'Like / Fond of', reading: 'すき', type: 'vocabulary', level: 'N5' },
        { surface: 'です', meaning: 'Is / Am / Are', reading: 'desu', type: 'particle', level: 'N5' },
    ];

    const grammarPoints = [
        { title: '〜は〜です', meaning: 'A is B', level: 'N5', explanation: 'The standard polite way to state that A is B.', examples: [{ ja: '私は学生です。', en: 'I am a student.' }] },
        { title: '〜が好きです', meaning: 'To like something', level: 'N5', explanation: 'Uses the "ga" particle to mark the object of liking.', examples: [{ ja: '寿司が好きです。', en: 'I like sushi.' }] }
    ];

    const openTokenModal = (token: any) => {
        setQuickViewData({
            type: 'TOKEN',
            title: token.surface,
            meaning: token.meaning,
            reading: token.reading,
            level: token.level,
            explanation: token.explanation,
        });
        setQuickViewOpen(true);
    };

    const openGrammarModal = (gp: any) => {
        setQuickViewData({
            type: 'GRAMMAR',
            title: gp.title,
            meaning: gp.meaning,
            level: gp.level,
            explanation: gp.explanation,
            examples: gp.examples,
        });
        setQuickViewOpen(true);
    };

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
                                <div
                                    key={i}
                                    onClick={() => openTokenModal(token)}
                                    className="flex flex-col items-center gap-2 group cursor-pointer relative"
                                >
                                    <span className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">
                                        {token.reading}
                                    </span>
                                    <span className="text-3xl font-black text-primary-dark border-b-4 border-primary hover:bg-primary/5 px-1 transition-all">
                                        {token.surface}
                                    </span>
                                    <span className="text-[10px] font-bold text-primary-dark/40">
                                        {token.meaning}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Grammar Points */}
                    <section className="clay-card p-8 bg-white">
                        <h3 className="text-xs font-black text-primary-dark opacity-30 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-secondary" />
                            Key Grammar Points
                        </h3>

                        <div className="flex flex-col gap-4">
                            {grammarPoints.map((gp, i) => (
                                <div
                                    key={i}
                                    onClick={() => openGrammarModal(gp)}
                                    className="p-4 bg-background rounded-clay border-2 border-primary-dark flex items-center justify-between group cursor-pointer hover:-translate-y-1 transition-all shadow-clay-sm"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-primary-dark">{gp.title}</span>
                                            <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/20">{gp.level}</span>
                                        </div>
                                        <p className="text-sm font-bold text-primary-dark/60">{gp.meaning}</p>
                                    </div>
                                    <Zap className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all" />
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
                            <button
                                onClick={() => openGrammarModal(grammarPoints[0])}
                                className="clay-btn w-full py-4 text-white bg-primary"
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                Open Drill Modal
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

            <QuickViewModal
                isOpen={quickViewOpen}
                onClose={() => setQuickViewOpen(false)}
                data={quickViewData}
                onAddToDeck={(d) => console.log('Add to deck', d)}
            />
        </div>
    );
}
