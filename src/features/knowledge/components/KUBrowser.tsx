'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/services/supabase/client';
import { RefreshCcw, Lock } from 'lucide-react';
import { useUser } from '@/features/auth/AuthContext';
import { getLocalLevelData } from '../actions';

interface KU {
    slug: string;
    character: string;
    search_key: string;
    meaning: string;
    level: number;
    type: string;
    state?: 'new' | 'learning' | 'review' | 'relearning' | 'burned';
    srs_stage?: number;
    reading?: string;
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

    const isGrammar = type === 'grammar';
    const [selectedJlpt, setSelectedJlpt] = useState('N5');
    const [selectedLevel, setSelectedLevel] = useState(isGrammar ? 5 : 1);

    const [kus, setKus] = useState<KU[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKUs = async () => {
            if (!user) return;
            setLoading(true);

            try {
                const localData = await getLocalLevelData(selectedLevel, type);

                if (localData && localData.length > 0) {
                    const slugs = localData.map((k: any) => k.slug);
                    const { data: stateData } = await supabase
                        .from('user_learning_states')
                        .select('slug:ku_id, state, srs_stage')
                        .eq('user_id', user.id)
                        .in('ku_id', slugs);

                    const stateMap = (stateData || []).reduce((acc: any, s: any) => {
                        acc[s.slug] = { state: s.state, srs_stage: s.srs_stage };
                        return acc;
                    }, {});

                    const formatted = localData.map((item: any) => {
                        const status = stateMap[item.slug];
                        return {
                            ...item,
                            state: status?.state || 'new',
                            srs_stage: status?.srs_stage || 0
                        };
                    });
                    setKus(formatted);
                } else {
                    setKus([]);
                }
            } catch (error) {
                console.error("Error fetching local data:", error);
                setKus([]);
            }
            setLoading(false);
        };
        fetchKUs();
    }, [type, selectedLevel, user, supabase]);

    const handleJlptChange = (jlpt: string) => {
        setSelectedJlpt(jlpt);
        if (!isGrammar) {
            const mapping = JLPT_MAPPING.find(j => j.label === jlpt)!;
            setSelectedLevel(mapping.range[0]);
        } else {
            const val = parseInt(jlpt.replace('N', ''));
            setSelectedLevel(val);
        }
    };

    const getSRSColor = (item: KU) => {
        const stage = item.srs_stage || 0;
        const state = item.state || 'new';
        if (state === 'new') return 'bg-blue-400';
        if (state === 'burned') return 'bg-slate-900';
        if (stage >= 1 && stage <= 4) return 'bg-pink-500';
        if (stage >= 5 && stage <= 6) return 'bg-purple-500';
        if (stage === 7) return 'bg-indigo-600';
        if (stage >= 8) return 'bg-sky-500';
        return 'bg-slate-200';
    };

    const currentMapping = JLPT_MAPPING.find(j => j.label === selectedJlpt)!;
    const levelsInJlpt = Array.from(
        { length: currentMapping.range[1] - currentMapping.range[0] + 1 },
        (_, i) => currentMapping.range[0] + i
    );

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <header className="mb-12 flex items-baseline justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">{title}</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        Official Curriculum <span className="w-1 h-1 rounded-full bg-slate-200" /> {selectedJlpt}
                    </p>
                </div>
                <div className="flex gap-1">
                    {['bg-blue-400', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-600', 'bg-sky-500', 'bg-slate-900'].map(c => (
                        <div key={c} className={cn("w-1.5 h-1.5 rounded-full", c)} />
                    ))}
                </div>
            </header>

            <nav className="mb-12">
                <div className="flex gap-8 border-b border-slate-100 mb-6">
                    {['N5', 'N4', 'N3', 'N2', 'N1'].map(jlpt => (
                        <button
                            key={jlpt}
                            onClick={() => handleJlptChange(jlpt)}
                            className={cn(
                                "pb-3 text-sm font-bold transition-colors relative",
                                selectedJlpt === jlpt ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {jlpt}
                            {selectedJlpt === jlpt && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900" />
                            )}
                        </button>
                    ))}
                </div>

                {!isGrammar && (
                    <div className="flex flex-wrap gap-2">
                        {levelsInJlpt.map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setSelectedLevel(lvl)}
                                className={cn(
                                    "w-10 h-10 rounded-lg text-xs font-bold transition-all border",
                                    selectedLevel === lvl
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-800 hover:text-slate-800"
                                )}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            <main>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                        {isGrammar ? `${selectedJlpt} Library` : `Level ${selectedLevel}`}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400">
                        {kus.filter(k => k.state !== 'new').length} / {kus.length} Mastered
                    </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-square bg-slate-50 rounded-lg border border-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {kus.map((item) => (
                            <KUCard key={item.slug} item={item} srsColor={getSRSColor(item)} />
                        ))}
                    </div>
                )}

                {!loading && kus.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-200">
                        <RefreshCcw size={32} className="mb-2 opacity-50" />
                        <p className="text-[10px] font-bold tracking-widest uppercase">No data found</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function KUCard({ item, srsColor }: { item: KU, srsColor: string }) {
    const router = useRouter();
    const isLocked = !item.state || item.state === 'new';
    const isGrammar = item.type === 'grammar';

    const handleClick = () => {
        const [type, identity] = item.slug.split('/');
        router.push(`/${type}/${identity}`);
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group cursor-pointer relative flex flex-col p-4 rounded-xl transition-all border border-slate-100",
                "bg-white hover:border-slate-300 hover:bg-slate-50/50",
                isLocked && "opacity-80 grayscale-[0.8]"
            )}
        >
            <div className="flex flex-col h-full space-y-2">
                <div className={cn("w-1 h-1 rounded-full", srsColor)} />

                <div className="space-y-0.5">
                    <div className={cn(
                        "font-japanese font-bold text-slate-900",
                        isGrammar ? "text-xs" : "text-xl"
                    )}>
                        {item.character || '?'}
                    </div>
                    {item.reading && !isGrammar && (
                        <div className="text-[9px] font-bold text-slate-300 font-japanese uppercase">
                            {item.reading}
                        </div>
                    )}
                    <div className="text-[10px] font-medium text-slate-400 line-clamp-2 leading-snug group-hover:text-slate-600 transition-colors">
                        {item.meaning}
                    </div>
                </div>
            </div>
        </div>
    );
}
