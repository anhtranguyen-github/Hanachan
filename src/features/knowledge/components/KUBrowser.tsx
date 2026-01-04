
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/services/supabase/client';
import { ChevronRight, Filter, Search, BookOpen, Layers, Zap, Flame, Lock, RefreshCcw } from 'lucide-react';
import { PageHeader } from '@/ui/components/PageHeader';
import { useUser } from '@/features/auth/AuthContext';

interface KU {
    slug: string;
    character: string;
    search_key: string;
    meaning: string;
    level: number;
    type: string;
    state?: 'new' | 'learning' | 'review' | 'relearning' | 'burned';
    // Extended metadata for different types
    reading?: string;
    secondary_text?: string;
}

const JLPT_MAPPING = [
    { label: 'N5', range: [1, 10] },
    { label: 'N4', range: [11, 20] },
    { label: 'N3', range: [21, 35] },
    { label: 'N2', range: [36, 50] },
    { label: 'N1', range: [51, 60] },
];

export function KUBrowser({ title, type }: { title: string, type: string }) {
    const supabase = createClient();
    const { user } = useUser();
    const [selectedJlpt, setSelectedJlpt] = useState('N5');
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [kus, setKus] = useState<KU[]>([]);
    const [loading, setLoading] = useState(true);

    const currentJlpt = JLPT_MAPPING.find(j => j.label === selectedJlpt)!;
    const levelsInJlpt = Array.from(
        { length: currentJlpt.range[1] - currentJlpt.range[0] + 1 },
        (_, i) => currentJlpt.range[0] + i
    );

    useEffect(() => {
        const fetchKUs = async () => {
            if (!user) return;
            setLoading(true);

            // 1. Fetch the basic KUs with their type-specific metadata
            // We use simple joins for the metadata targets
            const { data: kuData, error: kuError } = await supabase
                .from('knowledge_units')
                .select(`
                    slug, character, search_key, meaning, level, type,
                    ku_kanji (meaning_data, reading_data),
                    ku_vocabulary (reading_primary, meaning_data),
                    ku_radicals (name)
                `)
                .eq('type', type)
                .eq('level', selectedLevel);

            if (kuData) {
                // 2. Fetch learning states for the current user and THESE specific slugs
                const slugs = kuData.map(k => k.slug);
                const { data: stateData } = await supabase
                    .from('user_learning_states')
                    .select('slug:ku_id, state')
                    .eq('user_id', user.id)
                    .in('ku_id', slugs);

                // 3. Create a map for quick state lookup
                const stateMap = (stateData || []).reduce((acc: any, s: any) => {
                    acc[s.slug] = s.state;
                    return acc;
                }, {});

                // 4. Format the final list
                const formatted = kuData.map((item: any) => {
                    let meaning = item.meaning || item.search_key || '';
                    let reading = '';

                    if (item.type === 'kanji' && item.ku_kanji?.[0]) {
                        const k = item.ku_kanji[0];
                        meaning = meaning || k.meaning_data?.meanings?.[0] || '';
                        reading = k.reading_data?.onyomi?.[0] || k.reading_data?.kunyomi?.[0] || '';
                    } else if (item.type === 'vocabulary' && item.ku_vocabulary?.[0]) {
                        const v = item.ku_vocabulary[0];
                        meaning = meaning || v.meaning_data?.meanings?.[0] || '';
                        reading = v.reading_primary || '';
                    } else if (item.type === 'radical' && item.ku_radicals?.[0]) {
                        meaning = meaning || item.ku_radicals[0].name || '';
                    }

                    return {
                        ...item,
                        meaning: meaning,
                        reading: reading,
                        state: stateMap[item.slug] || 'new'
                    };
                });
                setKus(formatted);
            }
            setLoading(false);
        };
        fetchKUs();
    }, [type, selectedLevel, user]);

    const handleJlptChange = (jlpt: string) => {
        setSelectedJlpt(jlpt);
        const mapping = JLPT_MAPPING.find(j => j.label === jlpt)!;
        setSelectedLevel(mapping.range[0]);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header with Search & Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <PageHeader
                    title={title}
                    subtitle={`Browsing Levels ${currentJlpt.range[0]}-${currentJlpt.range[1]}`}
                    icon={BookOpen}
                    iconColor="text-rose-500"
                />

                {/* Legend - Professional Pill Layout */}
                <div className="flex flex-wrap gap-x-5 gap-y-2.5 items-center bg-white/50 backdrop-blur-sm p-4 px-6 rounded-full border border-slate-100 shadow-sm">
                    <LegendItem icon={Lock} label="New" color="bg-slate-50 text-slate-300 border-slate-100 border-dashed" />
                    <LegendItem icon={Zap} label="Learning" color="bg-blue-50 text-blue-500 border-blue-100" />
                    <LegendItem icon={Layers} label="Review" color="bg-purple-50 text-purple-600 border-purple-100" />
                    <LegendItem icon={RefreshCcw} label="Relearn" color="bg-amber-50 text-amber-600 border-amber-100" />
                    <LegendItem icon={Flame} label="Burned" color="bg-slate-800 text-white border-slate-900 icon-white" />
                </div>
            </div>

            {/* JLPT & Level Navigation */}
            <div className="space-y-4">
                {/* JLPT Tabs */}
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                    {JLPT_MAPPING.map(jlpt => (
                        <button
                            key={jlpt.label}
                            onClick={() => handleJlptChange(jlpt.label)}
                            className={cn(
                                "px-6 py-2 rounded-xl font-bold text-sm transition-all",
                                selectedJlpt === jlpt.label
                                    ? "bg-white text-rose-500 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {jlpt.label}
                        </button>
                    ))}
                </div>

                {/* Granular Level Sub-Tabs */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-400 self-center mr-2 uppercase tracking-widest">Levels ❯</span>
                    {levelsInJlpt.map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setSelectedLevel(lvl)}
                            className={cn(
                                "w-10 h-10 rounded-xl font-bold text-sm transition-all border flex items-center justify-center",
                                selectedLevel === lvl
                                    ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-rose-200 hover:text-rose-500"
                            )}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        Level {selectedLevel} <span className="ml-2 lowercase font-bold">({kus.length} items)</span>
                    </h3>
                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {kus.map((item) => (
                            <KUCard key={item.slug} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function KUCard({ item }: { item: KU }) {
    const isBurned = item.state === 'burned';
    const isReview = item.state === 'review';
    const isRelearning = item.state === 'relearning';
    const isLearning = item.state === 'learning';
    const isNew = item.state === 'new';

    // SRS Stage based styles - PRIMARY indicator
    const srsStyles = {
        new: "bg-white border-slate-100 border-dashed opacity-60 text-slate-400",
        learning: "bg-blue-50 border-blue-200 text-blue-600 shadow-sm shadow-blue-50",
        review: "bg-purple-50 border-purple-200 text-purple-600 shadow-sm shadow-purple-50",
        relearning: "bg-amber-50 border-amber-300 text-amber-700 shadow-sm shadow-amber-50",
        burned: "bg-slate-800 border-slate-900 text-white shadow-lg shadow-slate-200"
    }[item.state || 'new'];

    // KU Type based accent bar - UNIFIED to brand Rose color
    const typeAccent = "bg-rose-400";

    const Icon = isBurned ? Flame : isReview ? Layers : isLearning ? Zap : isRelearning ? RefreshCcw : null;
    const router = useRouter();

    const handleClick = () => {
        // Navigate to the detail page based on type and slug
        // slug is already in format "type/identity", e.g. "kanji/女"
        router.push(`/${item.slug}`);
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative aspect-[3/4.2] rounded-[20px] border-2 flex flex-col items-center justify-center p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden",
                srsStyles
            )}
        >
            {/* Type Accent Bar at bottom - Unified */}
            <div className={cn("absolute bottom-0 left-0 w-full h-1", typeAccent)} />

            {/* Status Icon */}
            {Icon && (
                <div className="absolute top-2 right-2 opacity-80">
                    <Icon size={12} className={isBurned ? "text-orange-400" : ""} />
                </div>
            )}

            {/* Reading (Above character) */}
            {item.reading && (
                <div className={cn(
                    "text-[10px] font-bold mb-0.5 opacity-60 font-japanese",
                    isBurned ? "text-slate-400" : "text-slate-500"
                )}>
                    {item.reading}
                </div>
            )}

            <div className={cn(
                "text-2xl font-black mb-1 font-japanese transition-transform group-hover:scale-110 duration-500 line-clamp-2 px-2 text-center",
                item.type === 'grammar' ? "text-lg" : "text-2xl",
                isBurned ? "text-white" : ""
            )}>
                {item.character || item.search_key || item.slug.split('/').pop() || '?'}
            </div>

            <div className={cn(
                "text-xs font-bold text-center line-clamp-2 px-1 leading-tight transition-colors",
                isBurned ? "text-slate-400 group-hover:text-slate-300" : "text-slate-500 group-hover:text-slate-900"
            )}>
                {item.meaning}
            </div>

            {/* Level indicator bottom right */}
            <div className="absolute bottom-2 right-2 text-[8px] font-black opacity-30">
                {item.level}
            </div>
        </div>
    );
}

function LegendItem({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
    return (
        <div className="flex items-center gap-2 group cursor-help">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110", color)}>
                <Icon size={12} className={color.includes('icon-white') ? "text-white" : ""} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
    );
}
