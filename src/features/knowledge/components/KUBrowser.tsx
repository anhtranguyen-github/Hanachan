
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/services/supabase/client';
import { ChevronRight, Filter, Search, BookOpen, Layers, Zap, Flame, Lock } from 'lucide-react';
import { PageHeader } from '@/ui/components/PageHeader';

interface KU {
    slug: string;
    character: string;
    meaning: string;
    level: number;
    type: string;
    state?: 'new' | 'learning' | 'review' | 'relearning' | 'burned';
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
            setLoading(true);
            const { data, error } = await supabase
                .from('knowledge_units')
                .select(`
                    slug, 
                    character, 
                    meaning, 
                    level, 
                    type,
                    user_learning_states (state)
                `)
                .eq('type', type)
                .eq('level', selectedLevel);

            if (data) {
                const formatted = data.map((item: any) => ({
                    ...item,
                    state: item.user_learning_states?.[0]?.state || 'new'
                }));
                setKus(formatted);
            }
            setLoading(false);
        };
        fetchKUs();
    }, [type, selectedLevel]);

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

                {/* Legend */}
                <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <LegendItem icon={Lock} label="New" color="bg-slate-100 text-slate-400 border-slate-200 border-dashed" />
                    <LegendItem icon={Zap} label="Learning" color="bg-blue-50 text-blue-500 border-blue-100" />
                    <LegendItem icon={Layers} label="Review" color="bg-purple-50 text-purple-600 border-purple-100" />
                    <LegendItem icon={Flame} label="Burned" color="bg-slate-800 text-white border-slate-900" />
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-slate-50 animate-pulse rounded-2xl border-2 border-slate-100"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
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
    const isReview = item.state === 'review' || item.state === 'relearning';
    const isLearning = item.state === 'learning';
    const isNew = item.state === 'new';

    // Type-based semantic color mapping
    const typeStyles = {
        radical: {
            bg: 'bg-blue-50/50',
            border: 'border-blue-200',
            text: 'text-blue-600',
            hover: 'hover:border-blue-400',
            accent: 'bg-blue-500'
        },
        kanji: {
            bg: 'bg-rose-50/50',
            border: 'border-rose-200',
            text: 'text-rose-600',
            hover: 'hover:border-rose-400',
            accent: 'bg-rose-500'
        },
        vocabulary: {
            bg: 'bg-purple-50/50',
            border: 'border-purple-200',
            text: 'text-purple-600',
            hover: 'hover:border-purple-400',
            accent: 'bg-purple-500'
        },
        grammar: {
            bg: 'bg-emerald-50/50',
            border: 'border-emerald-200',
            text: 'text-emerald-600',
            hover: 'hover:border-emerald-400',
            accent: 'bg-emerald-500'
        }
    }[item.type] || {
        bg: 'bg-slate-50/50',
        border: 'border-slate-200',
        text: 'text-slate-600',
        hover: 'hover:border-slate-400',
        accent: 'bg-slate-500'
    };

    return (
        <div className={cn(
            "group relative aspect-[4/5] rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all hover:scale-105 hover:shadow-xl cursor-pointer overflow-hidden",
            isNew && "bg-white border-slate-100 border-dashed opacity-80",
            isLearning && `${typeStyles.bg} ${typeStyles.border}`,
            isReview && `${typeStyles.bg} ${typeStyles.border} shadow-sm`,
            isBurned && "bg-slate-800 border-slate-900 text-white"
        )}>
            {/* Semantic Top bar for New/Learning items */}
            {!isBurned && (
                <div className={cn("absolute top-0 left-0 w-full h-1", typeStyles.accent)} />
            )}

            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
                {isBurned && <Flame size={12} className="text-orange-400" />}
                {isReview && <Layers size={12} className={cn(isBurned ? "text-slate-400" : typeStyles.text)} />}
                {isLearning && <Zap size={12} className={cn(isBurned ? "text-slate-400" : typeStyles.text)} />}
            </div>

            <div className={cn(
                "text-2xl font-black mb-1 font-japanese",
                isBurned ? "text-white" : `${typeStyles.text} transition-colors`
            )}>
                {item.character || '？'}
            </div>

            <div className={cn(
                "text-[10px] font-bold uppercase tracking-widest text-center line-clamp-2 px-1",
                isBurned ? "text-slate-400" : "text-slate-400 group-hover:text-slate-600"
            )}>
                {item.meaning}
            </div>

            {/* Level indicator bottom right */}
            <div className="absolute bottom-2 right-3 text-[10px] font-black opacity-20 group-hover:opacity-40 transition-opacity">
                L{item.level}
            </div>
        </div>
    );
}

function LegendItem({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center border", color)}>
                <Icon size={12} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
        </div>
    );
}
