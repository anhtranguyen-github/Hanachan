'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Book, Filter, Search, Loader2, Lock, Zap, Clock, Flame, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { kuRepository } from '@/features/knowledge/db';
import { learningRepository } from '@/features/learning/db';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/premium/GlassCard';
import { useUser } from '@/features/auth/AuthContext';
import Link from 'next/link';

function ContentDatabase() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type') as any;

    const [items, setItems] = useState<any[]>([]);
    const [states, setStates] = useState<Record<string, any>>({});
    const [userLevel, setUserLevel] = useState(1);
    const [filterType, setFilterType] = useState<string>(typeParam || 'all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userId = user.id;

            // 1. Fetch Items based on level/type
            let queryItems: any[] = [];
            if (selectedLevel !== 'all') {
                queryItems = await learningRepository.fetchLevelContent(selectedLevel, userId);
            } else {
                // Fetch first 200 items for library overview if no level selected
                const { data } = await supabase
                    .from('knowledge_units')
                    .select('*')
                    .limit(200);
                queryItems = data || [];
            }

            // 2. Fetch User States for these items
            const { data: userStates } = await supabase
                .from('user_learning_states')
                .select('*')
                .eq('user_id', userId);

            const stateMap: Record<string, any> = {};
            userStates?.forEach((s: any) => {
                stateMap[s.ku_id] = s;
            });

            setItems(queryItems);
            setStates(stateMap);

            // Fetch user level - default to 1 if not found
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('level')
                    .eq('id', userId)
                    .maybeSingle();
                setUserLevel(userData?.level || 1);
            } catch {
                setUserLevel(1);
            }

        } catch (error) {
            console.error("Failed to load library data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, filterType, selectedLevel]);

    const filteredItems = useMemo(() => {
        return items.filter(unit => {
            const state = states[unit.id];
            const status = unit.level > userLevel ? 'locked' : (!state ? 'new' : state.state);

            const matchesType = filterType === 'all' || unit.type === filterType;
            const matchesStatus = filterStatus === 'all' || status === filterStatus;
            const matchesSearch = unit.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
                unit.character?.includes(searchQuery);

            return matchesType && matchesStatus && matchesSearch;
        });
    }, [items, states, filterType, filterStatus, searchQuery, userLevel]);

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b-2 border-gray-100">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Content Library</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Browse {items.length} learning artifacts</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="bg-white border-2 border-gray-200 p-2 rounded-[24px] flex items-center shadow-sm">
                        <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="All" />
                        <FilterButton active={filterType === 'radical'} onClick={() => setFilterType('radical')} label="Radicals" />
                        <FilterButton active={filterType === 'kanji'} onClick={() => setFilterType('kanji')} label="Kanji" />
                        <FilterButton active={filterType === 'vocabulary'} onClick={() => setFilterType('vocabulary')} label="Vocab" />
                        <FilterButton active={filterType === 'grammar'} onClick={() => setFilterType('grammar')} label="Grammar" />
                    </div>
                </div>
            </header>

            {/* Advanced Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="col-span-2 relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors">
                        <Search size={22} strokeWidth={3} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search meanings or characters..."
                        className="w-full pl-16 pr-6 py-5 bg-white border-2 border-gray-200 rounded-[32px] text-gray-900 focus:border-primary focus:outline-none placeholder:text-gray-300 font-bold tracking-tight text-xl transition-all shadow-sm focus:shadow-lg focus:shadow-primary/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-4 col-span-2">
                    <select
                        className="flex-1 bg-white text-gray-500 px-6 py-4 border-2 border-gray-200 rounded-[24px] text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all cursor-pointer appearance-none hover:border-gray-300 shadow-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">Any Status</option>
                        <option value="new">New / Untouched</option>
                        <option value="learning">Current Integration</option>
                        <option value="review">Active Reinforcement</option>
                        <option value="burned">Terminal Mastery</option>
                        <option value="locked">Access Restricted</option>
                    </select>

                    <select
                        className="w-48 bg-white text-gray-500 px-6 py-4 border-2 border-gray-200 rounded-[24px] text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all cursor-pointer appearance-none hover:border-gray-300 shadow-sm"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    >
                        <option value="all">All Sectors</option>
                        {Array.from({ length: 60 }, (_, i) => i + 1).map(l => (
                            <option key={l} value={l}>Sector {l}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="py-40 flex flex-col items-center gap-6">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Querying central database...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredItems.map((unit) => {
                        const state = states[unit.id];
                        const status = unit.level > userLevel ? 'locked' : (!state ? 'new' : state.state);

                        const typeColor =
                            unit.type === 'radical' ? 'text-radical' :
                                unit.type === 'kanji' ? 'text-kanji' :
                                    unit.type === 'vocabulary' ? 'text-vocab' : 'text-grammar';

                        const typeBg =
                            unit.type === 'radical' ? 'hover:bg-radical' :
                                unit.type === 'kanji' ? 'hover:bg-kanji' :
                                    unit.type === 'vocabulary' ? 'hover:bg-vocab' : 'hover:bg-grammar';

                        const typeBorder =
                            unit.type === 'radical' ? 'hover:border-radical' :
                                unit.type === 'kanji' ? 'hover:border-kanji' :
                                    unit.type === 'vocabulary' ? 'hover:border-vocab' : 'hover:border-grammar';

                        return (
                            <Link href={`/content/${unit.type === 'vocabulary' ? 'vocabulary' : unit.type === 'radical' ? 'radicals' : unit.type}/${unit.slug}`} key={unit.id} className={clsx(
                                "aspect-square bg-white border-2 border-gray-200 rounded-[32px] flex flex-col items-center justify-center p-4 transition-all duration-300 shadow-sm group relative overflow-hidden",
                                status === 'locked' ? "opacity-40 grayscale pointer-events-none bg-gray-50" : `${typeBg} ${typeBorder} hover:text-white hover:-translate-y-1 hover:shadow-xl`
                            )}>
                                <div className="absolute top-4 right-4 opacity-100 transition-opacity group-hover:text-white">
                                    <StatusIcon status={status} />
                                </div>

                                <span className={clsx(
                                    "text-5xl font-black mb-2 transition-colors duration-300",
                                    status === 'locked' ? "text-gray-300" : typeColor,
                                    "group-hover:text-white"
                                )}>
                                    {unit.character || '—'}
                                </span>

                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white/80 transition-colors text-center w-full truncate px-2">
                                    {unit.meaning}
                                </span>

                                {state && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 group-hover:bg-white/20">
                                        <div
                                            className="h-full bg-green-400 group-hover:bg-white transition-all"
                                            style={{ width: `${Math.min(100, (state.reps / 10) * 100)}%` }}
                                        />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}

            {!loading && filteredItems.length === 0 && (
                <div className="text-center py-40 border-4 border-dashed border-gray-100 rounded-[56px] bg-gray-50/50">
                    <h3 className="text-3xl font-black text-gray-300 mb-2 uppercase tracking-tight">No results found</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Try adjusting your filters or search terms</p>
                </div>
            )}
        </div>
    );
}

function FilterButton({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                active ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
        >
            {label}
        </button>
    );
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'locked': return <Lock size={12} className="text-gray-300" />;
        case 'new': return <Zap size={12} className="text-yellow-400" />;
        case 'learning': return <Clock size={12} className="text-blue-400 group-hover:text-white" />;
        case 'review': return <Flame size={12} className="text-orange-400 group-hover:text-white" />;
        case 'burned': return <Check size={12} className="text-green-400 group-hover:text-white" strokeWidth={4} />;
        default: return null;
    }
}

export default function UnifiedContentPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
            <ContentDatabase />
        </Suspense>
    );
}

