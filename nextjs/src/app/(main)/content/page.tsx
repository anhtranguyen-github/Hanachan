'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Book, Search, Loader2, Lock, Zap, Clock, Flame, ChevronRight, Hash, Layers, Library } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';
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
            let query = supabase.from('knowledge_units').select('*');
            if (selectedLevel !== 'all') query = query.eq('level', selectedLevel);
            if (filterType !== 'all') query = query.eq('type', filterType);
            const { data: queryItems } = await query.order('level', { ascending: true }).order('type', { ascending: true }).limit(300);
            const { data: userStates } = await supabase.from('user_learning_states').select('*').eq('user_id', userId);
            const stateMap: Record<string, any> = {};
            userStates?.forEach((s: any) => { stateMap[s.ku_id] = s; });
            setItems(queryItems || []);
            setStates(stateMap);
            const { data: userData } = await supabase.from('users').select('level').eq('id', userId).maybeSingle();
            setUserLevel(userData?.level || 1);
        } catch (error) {
            console.error("Failed to load library data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadData();
    }, [user, filterType, selectedLevel]);

    const filteredItems = useMemo(() => {
        return items.filter(unit => {
            const state = states[unit.id];
            const status = unit.level > userLevel ? 'locked' : (!state ? 'new' : state.state);
            const matchesStatus = filterStatus === 'all' || status === filterStatus;
            const matchesSearch = unit.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
                unit.character?.includes(searchQuery) ||
                unit.slug.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [items, states, filterStatus, searchQuery, userLevel]);

    const tabs = [
        { id: 'all', label: 'ALL', icon: Layers, color: '#4A4E69' },
        { id: 'radical', label: 'RAD', icon: Hash, color: '#3A6EA5' },
        { id: 'kanji', label: 'KAN', icon: Book, color: '#D88C9A' },
        { id: 'vocabulary', label: 'VOC', icon: Zap, color: '#9B7DB5' },
        { id: 'grammar', label: 'GRM', icon: Flame, color: '#5A9E72' },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-3 animate-in fade-in duration-700">
            {/* Filter Bar */}
            <div className="flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-xl border border-border/40 rounded-3xl shadow-sm">
                {/* Type tabs + search row */}
                <div className="flex items-center gap-2">
                    <div className="flex p-0.5 bg-[#F7FAFC] border border-border/30 rounded-2xl gap-0.5 shrink-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = filterType === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterType(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black tracking-widest transition-all duration-300 uppercase",
                                        active ? "bg-white shadow-sm border border-border/20" : "text-foreground/30 hover:text-foreground/60"
                                    )}
                                    style={active ? { color: tab.color } : {}}
                                >
                                    <Icon size={9} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20 transition-colors group-focus-within:text-primary" size={13} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2 pl-8 pr-3 bg-transparent text-sm font-bold placeholder:text-foreground/20 outline-none"
                        />
                    </div>
                </div>

                {/* Filter selects */}
                <div className="flex gap-2 border-t border-border/20 pt-2">
                    <select
                        className="flex-1 bg-[#F7FAFC] border border-border/30 rounded-xl px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/60 outline-none cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="learning">Learning</option>
                        <option value="burned">Mastered</option>
                    </select>
                    <select
                        className="flex-1 bg-[#F7FAFC] border border-border/30 rounded-xl px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/60 outline-none cursor-pointer"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    >
                        <option value="all">All Levels</option>
                        {Array.from({ length: 60 }, (_, i) => i + 1).map(l => (
                            <option key={l} value={l}>Level {l}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-10 h-10 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">花</div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20">Loading...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(
                        filteredItems.reduce((acc, item) => {
                            if (!acc[item.level]) acc[item.level] = [];
                            acc[item.level].push(item);
                            return acc;
                        }, {} as Record<number, any[]>)
                    ).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, levelItems]) => (
                        <div key={level} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-gradient-to-br from-[#F4ACB7]/20 to-[#CDB4DB]/10 rounded-lg flex items-center justify-center border border-primary/10">
                                        <span className="text-[7px] font-black text-primary">{level}</span>
                                    </div>
                                    <h2 className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em]">Level {level}</h2>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-border/30 to-transparent" />
                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">{(levelItems as any[]).length}</span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                {(levelItems as any[]).map((unit) => {
                                    const state = states[unit.id];
                                    const status = unit.level > userLevel ? 'locked' : (!state ? 'new' : state.state);

                                    const typeTextColor: Record<string, string> = {
                                        radical: 'text-[#3A6EA5]',
                                        kanji: 'text-[#D88C9A]',
                                        vocabulary: 'text-[#9B7DB5]',
                                        grammar: 'text-[#5A9E72]',
                                    };

                                    const typeBorderColor: Record<string, string> = {
                                        radical: '#A2D2FF',
                                        kanji: '#F4ACB7',
                                        vocabulary: '#CDB4DB',
                                        grammar: '#B7E4C7',
                                    };

                                    return (
                                        <Link
                                            href={`/content/${unit.type === 'vocabulary' ? 'vocabulary' : unit.type === 'radical' ? 'radicals' : unit.type}/${unit.slug}`}
                                            key={unit.id}
                                            className={clsx(
                                                "group relative flex flex-col items-center bg-white border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg aspect-square justify-center gap-1 p-2",
                                                status === 'locked' && "opacity-40 grayscale pointer-events-none"
                                            )}
                                            style={{ borderColor: `${typeBorderColor[unit.type]}40` }}
                                        >
                                            {/* Type color top bar */}
                                            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: typeBorderColor[unit.type] }} />

                                            <div className={clsx(
                                                "text-2xl sm:text-3xl font-black transition-all group-hover:scale-110 duration-300 jp-text",
                                                typeTextColor[unit.type] || 'text-foreground'
                                            )}>
                                                {unit.character || '—'}
                                            </div>
                                            <h3 className="text-[7px] sm:text-[8px] font-black text-foreground/40 uppercase tracking-tight text-center line-clamp-1 px-1">
                                                {unit.meaning}
                                            </h3>

                                            {/* Status dot */}
                                            {state && (
                                                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeBorderColor[unit.type] }} />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredItems.length === 0 && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-white/50 border-2 border-dashed border-border/30 rounded-3xl">
                    <Search size={24} className="text-foreground/20" />
                    <div>
                        <h3 className="text-sm font-black text-foreground/20 uppercase tracking-widest">No Matches</h3>
                        <p className="text-[9px] font-bold text-foreground/10 uppercase tracking-[0.3em] mt-1">Try adjusting filters</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UnifiedContentPage() {
    return (
        <Suspense fallback={
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-10 h-10 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">花</div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        }>
            <ContentDatabase />
        </Suspense>
    );
}
