'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SakuraHeader } from '@/ui/components/sakura/SakuraHeader';
import { ContentCard } from '@/ui/components/shared/ContentCard';
import { FilterBar, type FilterStatus } from '@/ui/components/shared/FilterBar';
import { SakuraButton, type SakuraButtonVariant } from '@/ui/components/sakura/SakuraButton';

const JLPT_LEVEL_MAP: Record<string, number[]> = {
    'N5': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'N4': [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    'N3': [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    'N2': [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    'N1': [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
};

const JLPT_OPTIONS = ['N5', 'N4', 'N3', 'N2', 'N1'];

interface LevelData {
    level: number;
    items: any[];
    total: number;
}

interface ContentListViewProps {
    type: 'KANJI' | 'VOCABULARY' | 'RADICAL' | 'GRAMMAR';
    title: string;
    subtitle: string;
    accentColor: string; // Tailwind color class or hex
    initialDifficulty: string;
    initialLevelData: Record<number, LevelData>;
    initialSrsStatus: Record<string, { state: string, next_review: string }>;
    showBackButton?: boolean;
}

export function ContentListView({
    type,
    title,
    subtitle,
    accentColor,
    initialDifficulty,
    initialLevelData,
    initialSrsStatus,
    showBackButton = false
}: ContentListViewProps) {
    const [difficulty, setDifficulty] = useState(initialDifficulty);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [displayLimit, setDisplayLimit] = useState(100);
    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    const levelRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const levels = JLPT_LEVEL_MAP[difficulty] || [];

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const scrollToLevel = (level: number) => {
        setActiveLevel(level);
        levelRefs.current[level]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    let currentRenderCount = 0;

    return (
        <div className="bg-transparent pb-20">
            <SakuraHeader
                title={title}
                subtitle={subtitle}
                subtitleColor={accentColor}
                showBackButton={showBackButton}
                filter={<FilterBar activeStatus={statusFilter} onStatusChange={setStatusFilter} />}
                actions={
                    <div className="flex items-center gap-3">
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="appearance-none text-sakura-ink font-black px-4 py-2 border border-sakura-divider text-[10px] uppercase tracking-widest rounded-xl bg-sakura-bg-app outline-none"
                        >
                            {JLPT_OPTIONS.map(jlpt => <option key={jlpt} value={jlpt}>{jlpt}</option>)}
                        </select>
                        <div className="relative w-32 md:w-48 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sakura-cocoa/40" size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-sakura-bg-app border border-sakura-divider pl-9 pr-3 py-2 text-[10px] font-bold rounded-xl outline-none focus:border-sakura-cocoa/40"
                            />
                        </div>
                    </div>
                }
            />

            {/* Level Selector (Sub-sticky) */}
            <div className="sticky top-[100px] md:top-[140px] z-40 bg-white border-b border-sakura-divider py-3">
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center gap-6">
                    <div className="hidden md:flex flex-col flex-shrink-0">
                        <span className="text-[9px] font-black text-sakura-cocoa/30 uppercase tracking-[0.2em]">Jump to Level</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-1">
                        {levels.map(level => {
                            const hasLevelData = !!initialLevelData[level];
                            return (
                                <button
                                    key={level}
                                    onClick={() => scrollToLevel(level)}
                                    className={cn(
                                        "px-4 py-2 border text-[10px] font-black rounded-xl transition-all whitespace-nowrap",
                                        activeLevel === level
                                            ? "bg-sakura-cocoa text-white border-sakura-cocoa shadow-lg"
                                            : "bg-white text-sakura-ink border-sakura-divider hover:bg-sakura-bg-app"
                                    )}
                                    style={activeLevel === level ? { backgroundColor: accentColor, color: 'white', borderColor: accentColor } : {}}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                <div className="max-w-[1920px] mx-auto px-4 py-8 space-y-6">
                    {levels.map(level => {
                        const data = initialLevelData[level];
                        let items = data?.items || [];

                        if (debouncedSearchTerm || statusFilter !== 'all') {
                            const term = debouncedSearchTerm.toLowerCase();
                            items = items.filter(item => {
                                const char = item.character || item.title || item.slug;
                                const mainMeaning = Array.isArray(item.meanings?.primary) ? item.meanings.primary[0] : (item.meanings?.[0] || item.meaning || '');
                                const readings = item.readings?.primary || '';

                                const matchesSearch = !term || (
                                    char.includes(term) ||
                                    mainMeaning.toLowerCase().includes(term) ||
                                    (readings && readings.toLowerCase().includes(term))
                                );

                                const srsInfo = initialSrsStatus[item.slug];
                                const currentStatus = srsInfo ? (srsInfo.state?.toLowerCase() || 'new') : 'locked';
                                const matchesStatus = statusFilter === 'all' || statusFilter === currentStatus;
                                return matchesSearch && matchesStatus;
                            });
                        }

                        if (items.length === 0) return null;
                        const remainingSlots = Math.max(0, displayLimit - currentRenderCount);
                        if (remainingSlots === 0) return null;
                        const itemsToShow = items.slice(0, remainingSlots);
                        currentRenderCount += itemsToShow.length;

                        return (
                            <div key={level} ref={el => { levelRefs.current[level] = el; }} className="scroll-mt-48">
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-sakura-divider">
                                    <h2 className="text-sm font-black text-sakura-ink uppercase tracking-tighter">LEVEL {level}</h2>
                                    <span className="text-[10px] text-sakura-cocoa/40 font-black uppercase tracking-widest">[{items.length}]</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                    {itemsToShow.map(item => {
                                        const char = item.character || item.title || item.slug;
                                        const meaning = Array.isArray(item.meanings?.primary) ? item.meanings.primary[0] : (item.meanings?.[0] || item.meaning);
                                        const reading = item.readings?.primary;

                                        const typePath = type === 'RADICAL' ? 'radicals' : type === 'KANJI' ? 'kanji' : type === 'VOCABULARY' ? 'vocabulary' : 'grammar';

                                        return (
                                            <ContentCard
                                                key={char}
                                                type={type === 'RADICAL' ? 'RADICAL' : type as any}
                                                character={char}
                                                meaning={meaning}
                                                reading={reading}
                                                href={`/${typePath}/${encodeURIComponent(item.slug || char)}`}
                                                srsState={initialSrsStatus[item.slug]?.state as any}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {currentRenderCount >= displayLimit && (
                        <div className="flex justify-center pt-12 pb-20">
                            <SakuraButton
                                variant={type.toLowerCase() as SakuraButtonVariant}
                                size="lg"
                                onClick={() => setDisplayLimit(prev => prev + 100)}
                            >
                                Load More Nodes
                            </SakuraButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
