'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchItemDetails } from '@/features/srs/service';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Flame, Tag, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ItemDetailPage() {
    const params = useParams<{ type: string; slug: string }>();
    const router = useRouter();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.type && params?.slug) {
            loadItem();
        }
    }, [params]);

    const loadItem = async () => {
        try {
            const data = await fetchItemDetails(params.type, params.slug);
            setItem(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Loading definition...</div>;
    if (!item) return <div className="p-20 text-center text-slate-400 font-bold">Item not found.</div>;

    // Specific Rendering Logic based on Type
    const isKanji = params.type === 'kanji';
    const isVocab = params.type === 'vocabulary';
    const isRadical = params.type === 'radical';

    const details = isKanji ? item.ku_kanji?.[0] : isVocab ? item.ku_vocabulary?.[0] : item.ku_radicals?.[0];
    const userState = item.user_learning_states?.[0];

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full px-2 hover:bg-slate-100">
                    <ArrowLeft size={16} />
                </Button>
                <div className="flex items-center gap-2">
                    <span className="capitalize text-slate-500">{params.type}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-500">Level {item.level}</span>
                </div>
            </div>

            {/* Hero Section */}
            <div className="app-card overflow-hidden">
                <div className={cn(
                    "h-32 relative",
                    isKanji ? "bg-rose-50" : isVocab ? "bg-purple-50" : "bg-blue-50"
                )}>
                    {/* Background Pattern could go here */}
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        {isKanji && <span className="text-9xl font-black text-rose-500">字</span>}
                        {isVocab && <span className="text-9xl font-black text-purple-500">語</span>}
                        {isRadical && <span className="text-9xl font-black text-blue-500">部</span>}
                    </div>
                </div>

                <div className="px-8 pb-8 relative">
                    <div className={cn(
                        "w-32 h-32 rounded-3xl flex items-center justify-center text-6xl font-black text-white shadow-xl -mt-16 mb-6",
                        isKanji ? "bg-rose-500 shadow-rose-200" : isVocab ? "bg-purple-500 shadow-purple-200" : "bg-blue-500 shadow-blue-200"
                    )}>
                        {item.character || item.slug.split('/')[1]}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 capitalize mb-2">{item.meaning}</h1>
                            {details?.meaning_data?.meanings && (
                                <p className="text-slate-500 font-medium text-lg">
                                    Alternatively: {details.meaning_data.meanings.filter((m: string) => m.toLowerCase() !== item.meaning.toLowerCase()).join(', ')}
                                </p>
                            )}
                        </div>

                        {userState ? (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">SRS Status</span>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white",
                                    userState.state === 'burned' ? "bg-slate-800" :
                                        userState.state === 'review' ? "bg-emerald-500" : "bg-blue-500"
                                )}>
                                    {userState.state}
                                    {userState.srs_stage > 0 && ` (${userState.srs_stage})`}
                                </span>
                                {userState.next_review && (
                                    <span className="text-xs font-bold text-slate-400 mt-1">
                                        Active until: {new Date(userState.next_review).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <Button className="rounded-full bg-slate-900 text-white font-bold text-xs" onClick={() => router.push(`/study/level-${item.level}`)}>
                                Start Learning
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Readings Section (Kanji/Vocab) */}
            {(isKanji || isVocab) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Readings */}
                    <div className="app-card p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><BookOpen size={16} /></div>
                            <h3 className="text-lg font-black text-slate-800">Readings</h3>
                        </div>

                        {isKanji && details?.reading_data && (
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Onyomi (Chinese)</span>
                                    <div className="text-xl font-medium text-slate-700">{details.reading_data.onyomi?.join(', ') || 'None'}</div>
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Kunyomi (Japanese)</span>
                                    <div className="text-xl font-medium text-slate-700">{details.reading_data.kunyomi?.join(', ') || 'None'}</div>
                                </div>
                            </div>
                        )}

                        {isVocab && (
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Primary Reading</span>
                                <div className="text-2xl font-medium text-slate-700">{details.reading_primary}</div>
                            </div>
                        )}
                    </div>

                    {/* Combinations / Examples / Parts */}
                    <div className="app-card p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Tag size={16} /></div>
                            <h3 className="text-lg font-black text-slate-800">{isKanji ? "Found In Vocabulary" : "Parts"}</h3>
                        </div>

                        <div className="text-slate-500 font-medium">
                            {/* Placeholder for now as we need complex lookup for related vocab */}
                            <p className="italic opacity-60">Related items will be implemented in future graph updates.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Context / Mnemonic */}
            <div className="app-card p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600"><Flame size={16} /></div>
                    <h3 className="text-lg font-black text-slate-800">Mnemonic / Notes</h3>
                </div>
                <div className="prose prose-slate bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full max-w-none">
                    <p className="text-slate-600 leading-relaxed font-medium">
                        {details?.mnemonic || "No mnemonic available yet. Use your imagination!"}
                    </p>
                </div>
            </div>

        </div>
    );
}
