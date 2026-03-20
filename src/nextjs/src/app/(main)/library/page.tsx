'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Book, Search, Loader2, Lock, Zap, Clock, Flame, ChevronRight, Hash, Layers, Library, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/features/auth/AuthContext';
import { useLibrary } from '@/features/knowledge/hooks';
import Link from 'next/link';

function ContentDatabase() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type') as any;

    const [filterType, setFilterType] = useState<string>(typeParam || 'all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

    const { items, states, loading, error } = useLibrary({
        type: filterType,
        level: selectedLevel,
        query: searchQuery
    });

    const filteredItems = useMemo(() => {
        return items.filter(unit => {
            const state = states[unit.id];
            const status = !state ? 'new' : state.state;
            return filterStatus === 'all' || status === filterStatus;
        });
    }, [items, states, filterStatus]);

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
            <div className="bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-3xl p-3 shadow-sm border border-border/40 flex flex-col gap-3">
                {/* Top Row: Categories and Search */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Categories */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 shrink-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = filterType === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterType(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] sm:text-xs font-black tracking-wide transition-all whitespace-nowrap shrink-0",
                                        active
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "bg-[#F7FAFC] text-foreground/50 hover:bg-gray-100 hover:text-foreground/80 border border-border/20"
                                    )}
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative group bg-[#F7FAFC] rounded-2xl border border-border/20 focus-within:border-primary/30 focus-within:bg-white transition-all shadow-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full min-h-[40px] pl-10 pr-4 bg-transparent text-sm font-semibold text-[#3E4A61] placeholder:text-foreground/30 outline-none rounded-2xl"
                        />
                    </div>
                </div>

                {/* Bottom Row: Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Status Filter */}
                    <div className="flex-1 relative group">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full appearance-none bg-[#F7FAFC] group-hover:bg-gray-50 border border-border/20 rounded-2xl px-4 py-2.5 text-xs font-black text-[#3E4A61] outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
                        >
                            <option value="all">ALL STATUS</option>
                            <option value="new">NEW</option>
                            <option value="learning">LEARNING</option>
                            <option value="burned">MASTERED</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40 group-hover:text-primary transition-colors">
                            <ChevronDown size={14} />
                        </div>
                    </div>

                    {/* Level Filter */}
                    <div className="flex-1 relative group">
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="w-full appearance-none bg-[#F7FAFC] group-hover:bg-gray-50 border border-border/20 rounded-2xl px-4 py-2.5 text-xs font-black text-[#3E4A61] outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
                        >
                            <option value="all">ALL LEVELS</option>
                            {Array.from({ length: 60 }, (_, i) => i + 1).map(l => (
                                <option key={l} value={l}>LEVEL {l}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40 group-hover:text-primary transition-colors">
                            <ChevronDown size={14} />
                        </div>
                    </div>
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

                            {(() => {
                                const grammarItems = (levelItems as any[]).filter(u => u.type === 'grammar');
                                const nonGrammarItems = (levelItems as any[]).filter(u => u.type !== 'grammar');

                                return (
                                    <>
                                        {/* Square grid for vocab/kanji/radical */}
                                        {nonGrammarItems.length > 0 && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                                {nonGrammarItems.map((unit) => {
                                                    const state = states[unit.id];
                                                    const typeTextColor: Record<string, string> = { radical: 'text-[#3A6EA5]', kanji: 'text-[#D88C9A]', vocabulary: 'text-[#9B7DB5]' };
                                                    const typeBorderColor: Record<string, string> = { radical: '#A2D2FF', kanji: '#F4ACB7', vocabulary: '#CDB4DB' };
                                                    return (
                                                        <Link
                                                            href={`/library/${unit.type === 'vocabulary' ? 'vocabulary' : unit.type === 'radical' ? 'radicals' : unit.type}/${unit.slug}`}
                                                            key={unit.id}
                                                            className={clsx(
                                                                "group relative flex flex-col items-center bg-white border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg aspect-square justify-center gap-1 p-2"
                                                            )}
                                                            style={{ borderColor: `${typeBorderColor[unit.type]}40` }}
                                                        >
                                                            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: typeBorderColor[unit.type] }} />
                                                            <div className={clsx("text-2xl sm:text-3xl font-black transition-all group-hover:scale-110 duration-300 jp-text", typeTextColor[unit.type] || 'text-foreground')}>
                                                                {unit.character || '—'}
                                                            </div>
                                                            <h3 className="text-[7px] sm:text-[8px] font-black text-foreground/40 uppercase tracking-tight text-center line-clamp-1 px-1">
                                                                {unit.meaning}
                                                            </h3>
                                                            {state && (
                                                                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeBorderColor[unit.type] }} />
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Horizontal rows for grammar */}
                                        {grammarItems.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {grammarItems.map((unit) => {
                                                    const state = states[unit.id];
                                                    return (
                                                        <Link
                                                            href={`/library/grammar/${unit.slug}`}
                                                            key={unit.id}
                                                            className={clsx(
                                                                "group relative flex items-center gap-3 bg-white border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg px-4 py-3"
                                                            )}
                                                            style={{ borderColor: '#B7E4C740' }}
                                                        >
                                                            {/* Left accent bar */}
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: '#5A9E72' }} />

                                                            {/* Japanese pattern */}
                                                            <div className="text-base sm:text-lg font-black text-[#5A9E72] jp-text shrink-0 group-hover:scale-105 transition-transform duration-300 min-w-0">
                                                                {unit.character || '—'}
                                                            </div>

                                                            {/* Divider */}
                                                            <div className="w-px h-8 bg-[#B7E4C7]/40 shrink-0" />

                                                            {/* Meaning */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] sm:text-[10px] font-bold text-foreground/50 leading-tight line-clamp-2">
                                                                    {unit.meaning}
                                                                </p>
                                                            </div>

                                                            {/* JLPT badge */}
                                                            {unit.jlpt && (
                                                                <span className="shrink-0 text-[7px] font-black text-[#5A9E72]/60 bg-[#B7E4C7]/20 px-1.5 py-0.5 rounded-lg uppercase tracking-wider">
                                                                    N{unit.jlpt}
                                                                </span>
                                                            )}

                                                            {/* Status dot */}
                                                            {state && (
                                                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5A9E72' }} />
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
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
