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

            // Fetch user level
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

    const tabs = ['all', 'radical', 'kanji', 'vocabulary', 'grammar'];

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 font-sans text-[#3E4A61] animate-in fade-in duration-700">
            {/* Header: Study Hub / LIBRARY */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#FFB5B5]">
                        <Book size={14} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">STUDY HUB</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#3E4A61]">CONTENT LIBRARY</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-white border border-[#F0E0E0] p-1 rounded-2xl shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterType(tab)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${filterType === tab
                                ? 'bg-[#FFB5B5] text-white shadow-md'
                                : 'text-[#A0AEC0] hover:text-[#3E4A61]'
                                }`}
                        >
                            {tab === 'vocabulary' ? 'VOCAB' : tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0]" size={18} />
                    <input
                        type="text"
                        placeholder="Search meanings or characters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-4 pl-14 pr-6 bg-white border border-[#F0E0E0] rounded-2xl text-[13px] font-medium outline-none focus:border-[#FFB5B5] transition-all placeholder:text-[#CBD5E0] shadow-sm"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="appearance-none bg-white border border-[#F0E0E0] rounded-2xl px-6 py-4 w-full md:w-64 text-[10px] font-black uppercase tracking-widest text-[#3E4A61] outline-none focus:border-[#FFB5B5] cursor-pointer shadow-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">ANY STATUS</option>
                        <option value="new">UNTACKLED</option>
                        <option value="learning">INTEGRATING</option>
                        <option value="review">REINFORCING</option>
                        <option value="burned">MASTERED</option>
                        <option value="locked">RESTRICTED</option>
                    </select>

                    <select
                        className="appearance-none bg-white border border-[#F0E0E0] rounded-2xl px-6 py-4 w-full md:w-48 text-[10px] font-black uppercase tracking-widest text-[#3E4A61] outline-none focus:border-[#FFB5B5] cursor-pointer shadow-sm"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    >
                        <option value="all">LEVELS: 1-60</option>
                        {Array.from({ length: 60 }, (_, i) => i + 1).map(l => (
                            <option key={l} value={l}>LEVEL {l}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="py-40 flex flex-col items-center gap-6">
                    <Loader2 className="w-12 h-12 text-[#FFB5B5] animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#CBD5E0]">Loading...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {filteredItems.map((unit) => {
                        const state = states[unit.id];
                        const status = unit.level > userLevel ? 'locked' : (!state ? 'new' : state.state);

                        return (
                            <Link
                                href={`/content/${unit.type === 'vocabulary' ? 'vocabulary' : unit.type === 'radical' ? 'radicals' : unit.type}/${unit.slug}`}
                                key={unit.id}
                                className={clsx(
                                    "group bg-white border border-[#F0E0E0] rounded-3xl p-6 flex flex-col items-center justify-between min-h-[220px] transition-all hover:border-[#FFB5B5] hover:shadow-xl hover:shadow-[#FFB5B5]/5 cursor-pointer relative overflow-hidden",
                                    status === 'locked' && "opacity-40 grayscale pointer-events-none"
                                )}
                            >
                                {/* Progress Bar */}
                                {state && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-[#F0E0E0]">
                                        <div
                                            className="h-full bg-[#FFB5B5]/50 transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (state.reps / 10) * 100)}%` }}
                                        />
                                    </div>
                                )}

                                {/* Top Info */}
                                <div className="w-full flex justify-between items-start">
                                    <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">LEV {unit.level}</span>
                                    <StatusIcon status={status} />
                                </div>

                                {/* Character */}
                                <div className={clsx(
                                    "text-6xl font-medium my-4 transition-colors",
                                    unit.type === 'kanji' ? "text-[#FFB5B5]" : "text-[#3E4A61]"
                                )}>
                                    {unit.character || '—'}
                                </div>

                                {/* Footer Info */}
                                <div className="w-full space-y-1 text-center">
                                    <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">{unit.type}</p>
                                    <p className="text-[11px] font-black text-[#3E4A61] uppercase tracking-tight leading-tight line-clamp-2">{unit.meaning}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {!loading && filteredItems.length === 0 && (
                <div className="text-center py-40 border-2 border-dashed border-[#F0E0E0] rounded-[40px] bg-white">
                    <h3 className="text-2xl font-black text-[#A0AEC0] mb-2 uppercase tracking-tight">No Results</h3>
                    <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-[0.3em]">Refine your search parameters</p>
                </div>
            )}
        </div>
    );
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'locked': return <Lock size={12} className="text-[#CBD5E0]" />;
        case 'new': return <Zap size={12} className="text-[#FFD700]" strokeWidth={1} fill="currentColor" />;
        case 'learning': return <Clock size={12} className="text-[#A2D2FF]" />;
        case 'review': return <Flame size={12} className="text-[#FFB5B5]/60" />;
        case 'burned': return <Zap size={12} className="text-[#FFB5B5]" fill="currentColor" />;
        default: return null;
    }
}

export default function UnifiedContentPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#FFB5B5]" size={48} /></div>}>
            <ContentDatabase />
        </Suspense>
    );
}

