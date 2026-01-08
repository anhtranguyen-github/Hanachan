'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import {
    ChevronRight,
    RefreshCcw,
    Layers,
    Zap,
    BookOpen,
    Bookmark,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/services/supabase/client';
import { useUser } from '@/features/auth/AuthContext';
import { getLocalRelations, getLocalKU } from '../actions';

interface KUDetail {
    slug: string;
    character: string;
    meaning: string;
    level: number;
    type: string;
    meanings?: string[];
    onyomi?: string[];
    kunyomi?: string[];
    primary_reading?: string;
    state?: string;
    srs_stage?: number;
    next_review?: string;
    meaning_story?: string;
    reading_story?: string;
    structure_json?: string;
    examples?: any[];
}

export function KUDetailView({ slug, type }: { slug: string, type: string }) {
    const router = useRouter();
    const supabase = createClient();
    const { user } = useUser();
    const [data, setData] = useState<KUDetail | null>(null);
    const [localRelations, setLocalRelations] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const decodedSlug = decodeURIComponent(slug);
    const fullSlug = `${type}/${decodedSlug}`;

    useEffect(() => {
        const fetchDetail = async () => {
            if (!user) return;
            setLoading(true);

            try {
                // 1. Local Data
                const localData = await getLocalKU(type, decodedSlug);

                // 2. User State
                const { data: stateData } = await supabase
                    .from('user_learning_states')
                    .select('state, next_review, srs_stage')
                    .eq('user_id', user.id)
                    .eq('ku_id', fullSlug)
                    .maybeSingle();

                if (localData) {
                    const meanings = localData.meaning_data?.meanings || [];
                    const readings = localData.reading_data || (localData.reading_primary ? [localData.reading_primary] : []);

                    setData({
                        ...localData,
                        state: stateData?.state || 'locked',
                        srs_stage: stateData?.srs_stage || 0,
                        next_review: stateData?.next_review,
                        // Normalizing from V7 Structure
                        meanings: meanings,
                        onyomi: localData.reading_data?.onyomi || [],
                        kunyomi: localData.reading_data?.kunyomi || [],
                        primary_reading: localData.reading_primary || (Array.isArray(readings) ? readings[0] : ''),
                        meaning_story: localData.meaning_story?.text || localData.metadata?.mnemonic_meaning || '',
                        reading_story: localData.metadata?.mnemonic_reading || '',
                    } as any);

                    // 3. Local Relations (Sentences are handled by getLocalRelations in V7)
                    const relations = await getLocalRelations(type, decodedSlug);
                    setLocalRelations(relations);
                }
            } catch (error) {
                console.error("Error in detail view:", error);
            }
            setLoading(false);
        };

        fetchDetail();
    }, [fullSlug, user, supabase, type, decodedSlug]);

    if (loading) return <LoadingState />;
    if (!data) return <NotFoundState onBack={() => router.back()} />;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-500">
            {/* Minimal Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <button onClick={() => router.push(`/${type}`)} className="hover:text-slate-900 transition-colors">
                    {type}s
                </button>
                <ChevronRight size={10} />
                <span className="text-slate-900">Level {data.level}</span>
                <ChevronRight size={10} />
                <span className="text-slate-900">{data.character}</span>
            </div>

            {/* Title & Character */}
            <header className="flex flex-col md:flex-row gap-12 items-start md:items-center">
                <div className="w-32 h-32 rounded-3xl border border-slate-100 bg-white flex items-center justify-center text-5xl font-bold font-japanese shadow-sm">
                    {data.character}
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl font-bold text-slate-900 tracking-tight capitalize">
                        {data.meaning}
                    </h1>
                    {data.primary_reading && (
                        <p className="text-2xl font-bold text-slate-400 font-japanese">
                            {data.primary_reading}
                        </p>
                    )}
                </div>
            </header>

            {/* Content Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <div className="md:col-span-2 space-y-16">
                    {/* Mnemonic */}
                    {data.meaning_story && (
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meaning Mnemonic</h3>
                            <div className="text-lg leading-relaxed text-slate-700 font-serif whitespace-pre-wrap">
                                {data.meaning_story}
                            </div>
                        </section>
                    )}

                    {/* Readings (Kanji Only) */}
                    {data.type === 'kanji' && (
                        <section className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onyomi</h3>
                                <p className="text-2xl font-bold font-japanese">{data.onyomi?.join(', ') || 'None'}</p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kunyomi</h3>
                                <p className="text-2xl font-bold font-japanese">{data.kunyomi?.join(', ') || 'None'}</p>
                            </div>
                        </section>
                    )}

                    {/* Reading Mnemonic */}
                    {data.reading_story && (
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reading Mnemonic</h3>
                            <div className="text-lg leading-relaxed text-slate-700 font-serif whitespace-pre-wrap">
                                {data.reading_story}
                            </div>
                        </section>
                    )}

                    {/* Examples */}
                    {((data.examples && data.examples.length > 0) || (localRelations?.examples && localRelations.examples.length > 0)) && (
                        <section className="space-y-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Examples</h3>
                            <div className="space-y-4">
                                {[...(data.examples || []), ...(localRelations?.examples || [])].map((ex: any, i: number) => (
                                    <div key={i} className="p-6 rounded-2xl border border-slate-100 space-y-1">
                                        <div className="text-lg font-bold font-japanese text-slate-900">{ex.jp}</div>
                                        <div className="text-slate-500 text-sm">{ex.en}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar: Progress & Relations */}
                <aside className="space-y-12">
                    {/* Progress Card */}
                    <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="text-4xl font-bold text-slate-900">{data.srs_stage || 0}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">SRS STAGE</div>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-900 transition-all duration-1000"
                                style={{ width: `${Math.min(((data.srs_stage || 0) / 9) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Status</div>
                            <div className="text-sm font-bold text-slate-900 capitalize">{data.state}</div>
                        </div>
                    </div>

                    {/* Relations */}
                    {localRelations && (
                        <div className="space-y-10 border-t border-slate-100 pt-10">
                            {/* Radicals */}
                            {localRelations.components && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Components</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {localRelations.components.map((item: any) => (
                                            <button
                                                key={item.id}
                                                onClick={() => router.push(`/${item.type}/${item.id}`)}
                                                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center font-japanese text-lg font-bold hover:border-slate-800 transition-all"
                                            >
                                                {item.display}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Kanji usages */}
                            {localRelations.found_in_kanji && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Found in Kanji</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {localRelations.found_in_kanji.map((item: any) => (
                                            <button
                                                key={item.id}
                                                onClick={() => router.push(`/${item.type}/${item.id}`)}
                                                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center font-japanese text-lg font-bold hover:border-slate-800 transition-all"
                                            >
                                                {item.display}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vocabulary */}
                            {localRelations.related_vocab && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vocabulary</h4>
                                    <div className="space-y-2">
                                        {localRelations.related_vocab.map((item: any) => (
                                            <button
                                                key={item.id}
                                                onClick={() => router.push(`/${item.type}/${item.id}`)}
                                                className="w-full p-4 rounded-xl border border-slate-100 text-left hover:border-slate-300 transition-all flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="font-japanese font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{item.display}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">{item.subText}</div>
                                                </div>
                                                <ChevronRight size={12} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </div>

            <footer className="pt-24 pb-12 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <span>Internal System ID: {data.slug}</span>
                <button onClick={() => router.back()} className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={12} /> Return to Browser
                </button>
            </footer>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="max-w-4xl mx-auto py-32 px-6 flex flex-col items-center justify-center text-slate-200">
            <RefreshCcw size={48} className="animate-spin mb-4 opacity-50" />
            <p className="text-xs font-bold tracking-widest uppercase">Loading Metadata...</p>
        </div>
    );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
    return (
        <div className="max-w-4xl mx-auto py-32 px-6 flex flex-col items-center justify-center text-slate-300">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xs font-bold uppercase tracking-widest mb-8 text-slate-400">Resource not found in library</p>
            <Button variant="outline" onClick={onBack}>Browse Curriculum</Button>
        </div>
    );
}
