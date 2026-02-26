'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Book, Filter, Search, Loader2, Lock, Zap, Clock, Flame, ChevronRight, Hash, Layers } from 'lucide-react';
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

            const { data: queryItems } = await query.limit(300);
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
        { id: 'all', label: 'ALL', icon: Layers },
        { id: 'radical', label: 'RADICALS', icon: Hash },
        { id: 'kanji', label: 'KANJI', icon: Book },
        { id: 'vocabulary', label: 'VOCAB', icon: Zap },
        { id: 'grammar', label: 'GRAMMAR', icon: Flame },
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-lg py-2xl space-y-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-xl">
                <div className="space-y-sm">
                    <div className="flex items-center gap-xs">
                        <div className="p-sm bg-primary/10 rounded-xl">
                            <Book size={14} className="text-primary-dark" />
                        </div>
                        <span className="text-metadata font-black uppercase tracking-[0.3em] text-foreground/40">Curriculum Archives</span>
                    </div>
                    <h1 className="text-h1 font-black text-foreground tracking-tight leading-tight">
                        CONTENT LIBRARY
                    </h1>
                </div>

                {/* Categories Tab Bar */}
                <div className="flex p-xs bg-surface-muted/50 backdrop-blur-xl border border-border rounded-clay shadow-2xl shadow-primary/5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = filterType === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilterType(tab.id)}
                                className={clsx(
                                    "flex items-center gap-sm px-lg py-sm rounded-2xl text-metadata font-black tracking-widest transition-all duration-500 uppercase",
                                    active
                                        ? "bg-foreground text-surface shadow-xl shadow-foreground/20 scale-105"
                                        : "text-foreground/40 hover:text-foreground hover:bg-surface"
                                )}
                            >
                                <Icon size={12} />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-md p-xs bg-surface border border-border rounded-clay shadow-lg">
                <div className="flex-1 relative group">
                    <Search className="absolute left-lg top-1/2 -translate-y-1/2 text-foreground/20 transition-colors group-focus-within:text-primary" size={18} />
                    <input
                        type="text"
                        placeholder="Search meanings, characters, or slugs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-lg pl-xl pr-lg bg-transparent text-body font-bold placeholder:text-foreground/20 outline-none jp-text"
                    />
                </div>

                <div className="flex gap-sm p-sm">
                    <select
                        className="bg-surface-muted/50 border-none rounded-xl px-lg py-sm text-metadata font-black uppercase tracking-widest text-foreground outline-none cursor-pointer hover:bg-surface transition-colors"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">ANY STATUS</option>
                        <option value="new">UNTACKLED</option>
                        <option value="learning">INTEGRATING</option>
                        <option value="burned">MASTERED</option>
                        <option value="locked">RESTRICTED</option>
                    </select>

                    <select
                        className="bg-surface-muted/50 border-none rounded-xl px-lg py-sm text-metadata font-black uppercase tracking-widest text-foreground outline-none cursor-pointer hover:bg-surface transition-colors"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    >
                        <option value="all">LEVEL ALL</option>
                        {Array.from({ length: 60 }, (_, i) => i + 1).map(l => (
                            <option key={l} value={l}>LEVEL {l}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid Display */}
            {loading ? (
                <div className="py-2xl flex flex-col items-center justify-center gap-xl">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="text-metadata font-black uppercase tracking-[0.6em] text-foreground/20">Synchronizing Archives</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-lg">
                    {filteredItems.map((unit, idx) => {
                        const state = states[unit.id];
                        const status = unit.level > userLevel ? 'locked' : (!state ? 'new' : state.state);

                        return (
                            <Link
                                href={`/content/${unit.type === 'vocabulary' ? 'vocabulary' : unit.type === 'radical' ? 'radicals' : unit.type}/${unit.slug}`}
                                key={unit.id}
                                className={clsx(
                                    "group premium-card p-0 flex flex-col items-stretch bg-surface border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden h-lib-card",
                                    status === 'locked' && "opacity-40 grayscale pointer-events-none"
                                )}
                            >
                                {/* Card Header with Type & Level */}
                                <div className="p-md flex justify-between items-center bg-surface-muted/30 border-b border-border/50 h-[48px] shrink-0">
                                    <div className="flex items-center gap-sm">
                                        <div className={clsx(
                                            "w-1.5 h-1.5 rounded-full shadow-sm",
                                            unit.type === 'radical' ? "bg-radical" :
                                                unit.type === 'kanji' ? "bg-kanji" :
                                                    unit.type === 'vocabulary' ? "bg-vocab" : "bg-grammar"
                                        )} />
                                        <span className="text-metadata font-black uppercase tracking-widest text-foreground/30">{unit.type}</span>
                                    </div>
                                    <span className="text-metadata font-black text-foreground/40 bg-surface px-2 py-0.5 rounded-md border border-border">L{unit.level}</span>
                                </div>

                                {/* Main Character Section */}
                                <div className="flex-1 flex flex-col items-center justify-center p-lg gap-sm overflow-hidden min-h-0">
                                    <div className={clsx(
                                        "text-5xl font-black transition-all group-hover:scale-110 duration-500 jp-text truncate max-w-full",
                                        unit.type === 'kanji' ? "text-kanji" :
                                            unit.type === 'vocabulary' ? "text-primary-dark" : "text-foreground"
                                    )}>
                                        {unit.character || '—'}
                                    </div>
                                    <h3 className="text-metadata font-black text-foreground/60 uppercase tracking-tight text-center line-clamp-2 px-2 italic max-h-[2.4em]">
                                        {unit.meaning}
                                    </h3>
                                </div>

                                {/* Status Footer */}
                                <div className="px-lg py-md bg-surface-muted/10 border-t border-border/30 flex justify-between items-center group-hover:bg-primary/5 transition-colors h-[48px] shrink-0">
                                    <StatusTag status={status} />
                                    <ChevronRight size={14} className="text-foreground/10 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                </div>

                                {/* Mini Progress Indicator - Fixed at bottom */}
                                {state && (
                                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-border/10">
                                        <div className="h-full bg-primary/40 transition-all duration-1000" style={{ width: `${Math.min(100, (state.reps / 12) * 100)}%` }} />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}

            {!loading && filteredItems.length === 0 && (
                <div className="py-2xl flex flex-col items-center justify-center text-center space-y-lg bg-surface-muted/20 border-2 border-dashed border-border rounded-clay">
                    <Search size={32} className="text-foreground/10" />
                    <div className="space-y-sm">
                        <h3 className="text-h2 font-black text-foreground/20 uppercase tracking-widest">No Matches</h3>
                        <p className="text-metadata font-bold text-foreground/10 uppercase tracking-[0.4em]">Try adjusting filters</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusTag({ status }: { status: string }) {
    const config: any = {
        locked: { label: 'RESTRICTED', color: 'bg-foreground/5 text-foreground/20', icon: Lock },
        new: { label: 'NEW ENTRY', color: 'bg-yellow-400/10 text-yellow-600', icon: Zap },
        learning: { label: 'TRAINING', color: 'bg-blue-400/10 text-blue-600', icon: Clock },
        review: { label: 'REINFORCING', color: 'bg-primary/10 text-primary-dark', icon: Flame },
        burned: { label: 'MASTERED', color: 'bg-green-400/10 text-green-600', icon: Book },
    };

    const s = config[status] || config.new;
    const Icon = s.icon;

    return (
        <div className={clsx("flex items-center gap-xs px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all", s.color)}>
            <Icon size={10} strokeWidth={3} />
            {s.label}
        </div>
    );
}

export default function UnifiedContentPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
            <ContentDatabase />
        </Suspense>
    );
}
