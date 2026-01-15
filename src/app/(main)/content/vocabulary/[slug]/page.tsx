
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
    Zap,
    Tag,
    MessageCircle,
    Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

const SRS_STAGES: Record<string, { label: string, color: string }> = {
    'new': { label: 'New', color: 'bg-gray-100 text-gray-600 border-gray-300' },
    'learning': { label: 'Learning', color: 'bg-blue-100 text-blue-600 border-blue-300' },
    'review': { label: 'Review', color: 'bg-green-100 text-green-600 border-green-300' },
    'relearning': { label: 'Relearn', color: 'bg-orange-100 text-orange-600 border-orange-300' },
    'burned': { label: 'Burned', color: 'bg-purple-100 text-purple-600 border-purple-300' },
};

export default function VocabularyDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            MockDB.fetchItemDetails('vocabulary', `vocabulary/${decodeURIComponent(slug as string)}`).then(res => {
                setItem(res);
                setLoading(false);
            });
        }
    }, [slug]);

    if (loading) return <div className="p-12 animate-pulse text-center font-black">Loading Vocabulary...</div>;
    if (!item) return <div className="p-12 text-center font-black">Vocabulary not found.</div>;

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
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="clay-card p-8 bg-white flex flex-col items-center text-center gap-6">
                        <div className="w-32 h-32 bg-primary/5 rounded-[40px] border-4 border-primary-dark flex items-center justify-center text-6xl font-black text-primary-dark shadow-clay">
                            {item.character}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-black text-primary">
                                    {item.ku_vocabulary?.reading_primary}
                                </span>
                                <Volume2 className="w-6 h-6 text-primary cursor-pointer hover:scale-110 transition-transform" />
                            </div>
                            <h2 className="text-4xl font-black text-primary-dark capitalize">{item.meaning}</h2>
                        </div>

                        <div className={`px-4 py-1 rounded-full text-xs font-black uppercase border-2 ${stage.color}`}>
                            {stage.label}
                        </div>
                    </div>

                    <div className="clay-card p-6 bg-primary-dark text-white border-primary-dark">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-secondary fill-current" />
                            <h3 className="font-black text-sm uppercase">Quick Actions</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button className="clay-btn bg-white !text-primary-dark w-full py-3">
                                Add to Custom Deck
                            </button>
                            <button className="clay-btn bg-secondary w-full py-3">
                                Mark as Burned
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-8">
                    <section className="clay-card p-8 bg-white">
                        <h3 className="text-xl font-black text-primary-dark mb-6 flex items-center gap-2">
                            <Tag className="w-6 h-6 text-primary" />
                            Dictionary Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-background border-2 border-primary-dark rounded-clay">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40 block mb-1">Part of Speech</span>
                                <span className="font-bold text-primary-dark capitalize">
                                    {item.ku_vocabulary?.parts_of_speech?.join(', ') || 'Noun'}
                                </span>
                            </div>
                            <div className="p-4 bg-background border-2 border-primary-dark rounded-clay">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40 block mb-1">JLPT Level</span>
                                <span className="font-bold text-primary-dark">N{6 - (item.level || 5)}</span>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-primary/5 border-2 border-primary-dark border-dashed rounded-clay">
                            <h4 className="text-[10px] font-black uppercase text-primary mb-2">Meaning Details</h4>
                            <p className="font-bold text-primary-dark/80">
                                Primary: {item.meaning}
                                {item.ku_vocabulary?.meaning_data?.meanings?.length > 1 && (
                                    <span className="block mt-1 text-sm">
                                        Other values: {item.ku_vocabulary.meaning_data.meanings.slice(1).join(', ')}
                                    </span>
                                )}
                            </p>
                        </div>
                    </section>

                    <section className="clay-card p-8 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-primary-dark flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 text-primary" />
                                Example Sentences
                            </h3>
                            <button className="text-xs font-black text-primary flex items-center gap-1 hover:underline">
                                <Sparkles className="w-4 h-4" />
                                Generate New
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            {[
                                { ja: '猫は魚が好きです。', en: 'Cats like fish.', origin: 'System' },
                                { ja: '学校に猫がいました。', en: 'There was a cat at school.', origin: 'Mined' },
                            ].map((s, i) => (
                                <div key={i} className="p-6 bg-background rounded-[24px] border-2 border-primary-dark flex flex-col gap-2">
                                    <div className="text-xl font-black text-primary-dark leading-relaxed">{s.ja}</div>
                                    <div className="text-sm font-bold text-primary-dark/50 italic">{s.en}</div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white border border-primary-dark/10 rounded-full">{s.origin}</span>
                                        <button className="text-[10px] font-black text-primary hover:underline">Analyze</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
