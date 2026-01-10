'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutGrid, List, Loader2, Play, Sparkles, Monitor, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SakuraHeader } from '@/ui/components/sakura/SakuraHeader';
import { BRAND_COLORS, CONTENT_TYPES } from '@/config/design.config';

// --- Mock Data & Types ---
interface Deck {
    id: string;
    name: string;
    description?: string;
    slug?: string;
}

interface DeckItem {
    contentId: string;
    contentType: string;
    content: any;
}

const toggleBookmarkAction = async (id: string) => ({ is_bookmarked: true });

import { DeckStatsChart, ReviewForecastChart } from '@/features/analytics/components/DeckCharts';
import { ActivityGraph } from '@/features/analytics/components/DeckProgressCharts';

interface DeckStats {
    total_cards: number;
    new_cards: number;
    learning_cards: number;
    review_cards: number;
    mastered_cards: number;
    due_cards: number;
}

interface DeckDetailViewProps {
    deck: Deck;
    initialItems: DeckItem[];
    initialStats: DeckStats;
    initialForecast: any[];
    initialActivity: any[];
    initialActivityStats: any;
    isCompleted?: boolean;
}

export function DeckDetailView({
    deck: initialDeck,
    initialItems,
    initialStats,
    initialForecast,
    initialActivity,
    initialActivityStats,
    isCompleted
}: DeckDetailViewProps) {
    const router = useRouter();
    const [deck, setDeck] = useState<Deck>(initialDeck);
    const [items, setItems] = useState<DeckItem[]>(initialItems);
    const [stats, setStats] = useState<DeckStats>(initialStats);
    const [forecast, setForecast] = useState<any[]>(initialForecast);
    const [activity, setActivity] = useState<any[]>(initialActivity);
    const [activityStats, setActivityStats] = useState<any>(initialActivityStats);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [showCompletedToast, setShowCompletedToast] = useState(isCompleted || false);

    useEffect(() => {
        if (showCompletedToast) {
            const timer = setTimeout(() => setShowCompletedToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showCompletedToast]);



    const dueCount = stats?.due_cards || 0;
    const newCount = stats?.new_cards || 0;
    const canStudy = items.length > 0 && (dueCount > 0 || newCount > 0);

    return (
        <div className="min-h-screen bg-transparent pb-20">
            {showCompletedToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
                    <div className="bg-sakura-ink text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3">
                        <Sparkles size={16} className="text-purple-400" />
                        Matrix Sync Complete!
                    </div>
                </div>
            )}

            <SakuraHeader
                title={deck.name}
                subtitle="Deck Detail"
                subtitleColor={BRAND_COLORS.sakuraCocoa}
                showBackButton
                actions={
                    <div className="flex items-center gap-3">
                        <Link
                            href={canStudy ? `/decks/${deck.slug || deck.id}/study` : '#'}
                            className={cn(
                                "flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap",
                                canStudy
                                    ? "bg-sakura-cocoa text-white shadow-lg shadow-sakura-cocoa/20"
                                    : "bg-sakura-bg-app text-sakura-cocoa/30 border border-sakura-divider cursor-not-allowed"
                            )}
                        >
                            <Play size={16} fill="currentColor" /> {dueCount > 0 ? `${dueCount} Reviews` : "Sync Now"}
                        </Link>
                    </div>
                }
            />

            <main className="max-w-6xl mx-auto px-6 py-10">
                {deck.description && (
                    <div className="mb-10 p-8 md:p-12 rounded-[3.5rem] bg-white border border-sakura-divider shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sakura-bg-app rounded-full -mr-12 -mt-12" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-cocoa/30 mb-4">Chronicle Archive</h2>
                        <p className="text-2xl font-black text-sakura-ink leading-tight tracking-tight max-w-2xl">{deck.description}</p>
                    </div>
                )}

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-1 bg-sakura-cocoa rounded-full" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-cocoa/40">Efficiency Metrics</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <DeckStatsChart stats={stats} className="border-none bg-gradient-to-br from-white to-sakura-bg-soft" />
                        {forecast.length > 0 && <ReviewForecastChart forecast={forecast} className="border-none bg-gradient-to-br from-white to-sakura-bg-soft" />}
                    </div>
                    {activity.length > 0 && (
                        <ActivityGraph title="Deck Activity Heatmap" subtitle="Frequency of studies and reviews over time" data={activity} stats={activityStats} />
                    )}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-1 bg-sakura-text-primary rounded-full" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-sakura-text-muted">Cards in Deck</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-sakura-bg-soft p-1.5 rounded-2xl border border-sakura-divider">
                        <button onClick={() => setViewMode('list')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-sakura-accent-primary " : "text-sakura-text-muted")}>
                            <List size={20} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-sakura-accent-primary " : "text-sakura-text-muted")}>
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-sakura-divider border-dashed">
                        <p className="text-sakura-text-muted font-bold text-lg">Your deck is currently empty.</p>
                    </div>
                ) : (
                    <div className={cn("bg-white rounded-[2.5rem] border border-sakura-divider overflow-hidden", viewMode === 'grid' && "bg-transparent border-none")}>
                        <div className={cn(viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" : "divide-y divide-sakura-divider")}>
                            {items.map((item, index) => (
                                <ItemRow key={`${item.contentId}-${index}`} item={item} viewMode={viewMode} />
                            ))}
                        </div>
                    </div>
                )}
            </main>


        </div>
    );
}

function ItemRow({ item, viewMode }: { item: DeckItem; viewMode: 'grid' | 'list' }) {
    const { content, contentType } = item;
    const title = contentType === 'GRAMMAR' ? content.title || content.slug : contentType === 'RADICAL' ? content.character || content.name : content.character;
    const meaning = contentType === 'GRAMMAR' ? content.meanings?.[0] || content.title : contentType === 'RADICAL' ? content.meaning : Array.isArray(content.meanings?.primary) ? content.meanings.primary[0] : content.meanings?.primary;

    const contentDesign = CONTENT_TYPES[contentType.toLowerCase() as keyof typeof CONTENT_TYPES] || CONTENT_TYPES.vocabulary;
    const typeColor = contentDesign.inkColor;

    return (
        <div className={cn("group flex items-center justify-between transition-all hover:bg-sakura-bg-soft/50", viewMode === 'grid' ? "flex-col p-6 rounded-[2rem] bg-white border border-sakura-divider" : "px-8 py-6")}>
            <div className={cn("flex items-center gap-6", viewMode === 'grid' && "flex-col text-center")}>
                <div
                    className={cn("rounded-[1.25rem] flex items-center justify-center text-white font-black", viewMode === 'grid' ? "w-20 h-20 text-3xl mb-4" : "w-12 h-12 text-xl")}
                    style={{ backgroundColor: typeColor }}
                >{title}</div>
                <div>
                    <h4 className="text-lg font-black text-sakura-text-primary group-hover:text-sakura-accent-primary transition-colors">{meaning}</h4>
                    <div className="flex items-center gap-2 mt-1 justify-center lg:justify-start">
                        <span className="text-[10px] font-black text-sakura-text-muted uppercase tracking-widest px-2 py-0.5 bg-sakura-bg-soft rounded-lg">{contentType}</span>
                        {content.level && <span className="text-[10px] font-black text-sakura-text-muted/50 uppercase tracking-widest">Lvl {content.level}</span>}
                    </div>
                </div>
            </div>
            <div className={cn("flex items-center gap-3", viewMode === 'grid' ? "mt-6 w-full" : "opacity-0 group-hover:opacity-100")}>
                <Link href={`/${contentType === 'VOCABULARY' ? 'vocabulary' : contentType === 'KANJI' ? 'kanji' : contentType === 'RADICAL' ? 'radicals' : 'grammar'}/${contentType === 'GRAMMAR' ? content.slug : encodeURIComponent(content.slug || content.character || content.name)}`} className={cn("p-3 bg-sakura-bg-soft rounded-2xl", viewMode === 'grid' && "flex-1 flex justify-center")}>
                    <ArrowLeft className="rotate-180" size={18} />
                </Link>
            </div>
        </div>
    );
}
