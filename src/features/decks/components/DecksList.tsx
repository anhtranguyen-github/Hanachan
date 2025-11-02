import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Flame, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/ui/components/ui/skeleton';
import { SakuraHeader } from '@/ui/components/sakura/SakuraHeader';
import { BRAND_COLORS } from '@/config/design.config';
import { DeckCard } from '@/features/decks/components/DeckCard';

// --- Mock Data & Types ---
interface Deck {
    id: string;
    name: string;
    description?: string;
    itemCount?: number;
    mastered_count?: number;
    learning_count?: number;
    review_count?: number;
    due_count?: number;
    slug: string;
    is_bookmarked?: boolean;
}

const toggleBookmarkAction = async (id: string) => ({ is_bookmarked: true });

interface DecksListProps {
    initialDecks: Deck[];
    globalReviews: number;
}

export function DecksList({ initialDecks, globalReviews }: DecksListProps) {
    const [decks, setDecks] = useState<Deck[]>(initialDecks);
    const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'active'>('all');
    const [isBookmarking, setIsBookmarking] = useState<string | null>(null);

    const handleToggleBookmark = async (deckId: string) => {
        setIsBookmarking(deckId);
        try {
            setDecks(prev => prev.map(d => {
                if (d.id === deckId) return { ...d, is_bookmarked: !d.is_bookmarked };
                return d;
            }));
            const res = await toggleBookmarkAction(deckId);
            setDecks(prev => prev.map(d => {
                if (d.id === deckId) return { ...d, is_bookmarked: res.is_bookmarked };
                return d;
            }));
        } catch (error) {
            console.error("Failed to toggle bookmark", error);
            setDecks(initialDecks);
        } finally {
            setIsBookmarking(null);
        }
    };

    // Filtering & Categorization for "Peek" Strategy
    const activeDecks = decks.filter(d => (d.mastered_count || 0) > 0 || (d.learning_count || 0) > 0);
    const otherDecks = decks.filter(d => (d.mastered_count || 0) === 0 && (d.learning_count || 0) === 0);

    const filteredDecks = decks.filter(deck => {
        if (activeFilter === 'favorites') return deck.is_bookmarked;
        if (activeFilter === 'active') return (deck.mastered_count || 0) > 0 || (deck.learning_count || 0) > 0;
        return true;
    });

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <SakuraHeader
                title="Decks"
                subtitle="Study Collections"
                subtitleColor="#F43F5E"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative w-32 md:w-48 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sakura-cocoa/40" size={14} />
                            <input
                                type="text"
                                placeholder="Search decks..."
                                className="w-full bg-sakura-bg-app border border-sakura-divider pl-9 pr-3 py-2 text-[10px] font-bold rounded-xl outline-none focus:border-sakura-cocoa/40 transition-all"
                            />
                        </div>
                        {globalReviews > 0 && (
                            <Link
                                href="/study/global"
                                className="flex items-center gap-3 px-6 py-2.5 bg-[#4A3728] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:-translate-y-0.5 hover:bg-[#5A4738] transition-all shadow-lg shadow-[#4A3728]/20"
                            >
                                <Flame size={16} fill="currentColor" />
                                <span>Global Sync ({globalReviews})</span>
                            </Link>
                        )}
                    </div>
                }
            />

            <main className="max-w-7xl mx-auto w-full px-4 md:px-8 space-y-12 py-10">
                {/* Stats Peek */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Burned" value="1.2k" color="#F59E0B" />
                    <StatCard label="Mastered" value="450" color="#4F46E5" />
                    <StatCard label="Learning" value="82" color="#06B6D4" />
                    <StatCard label="Success Rate" value="94%" color="#059669" />
                </div>

                {/* Filter Substrate */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                    <FilterTab
                        active={activeFilter === 'all'}
                        onClick={() => setActiveFilter('all')}
                        label="Unified Substrate"
                    />
                    <FilterTab
                        active={activeFilter === 'favorites'}
                        onClick={() => setActiveFilter('favorites')}
                        label="Pinned"
                        icon={Bookmark}
                        activeClass="bg-sakura-cocoa text-white"
                    />
                    <FilterTab
                        active={activeFilter === 'active'}
                        onClick={() => setActiveFilter('active')}
                        label="In Flux"
                        activeClass="bg-sakura-ink text-white"
                    />
                </div>

                {/* Grid Synthesis */}
                <div className="space-y-16">
                    {activeFilter === 'all' && activeDecks.length > 0 && (
                        <section>
                            <SectionHeader title="Active Study" subtitle="Decks currently in retrieval loop" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {activeDecks.map(deck => (
                                    <DeckCard
                                        key={deck.id}
                                        {...deck}
                                        id={deck.id}
                                        dueCount={deck.due_count}
                                        masteredCount={deck.mastered_count}
                                        learningCount={deck.learning_count}
                                        onToggleBookmark={handleToggleBookmark}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <SectionHeader
                            title={activeFilter === 'all' ? "Library Archive" : activeFilter === 'favorites' ? "Pinned Decks" : "Study Flux"}
                            subtitle="Expand your conceptual matrix"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {(activeFilter === 'all' ? otherDecks : filteredDecks).map(deck => (
                                <DeckCard
                                    key={deck.id}
                                    {...deck}
                                    id={deck.id}
                                    dueCount={deck.due_count}
                                    masteredCount={deck.mastered_count}
                                    learningCount={deck.learning_count}
                                    onToggleBookmark={handleToggleBookmark}
                                    compact={true}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Empty Substrate */}
                {filteredDecks.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-sakura-divider border-dashed">
                        <Search size={40} className="mx-auto mb-6 text-sakura-cocoa/20" />
                        <h3 className="text-xl font-black text-sakura-ink mb-2 uppercase tracking-tighter">Null Result</h3>
                        <p className="text-[10px] text-sakura-cocoa/40 font-black uppercase tracking-widest">
                            No decks found in current matrix.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-sakura-divider shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: color, borderRadius: '0 0 0 100%' }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40 mb-1">{label}</p>
            <p className="text-3xl font-black text-sakura-ink tracking-tighter" style={{ color: color }}>{value}</p>
        </div>
    );
}


function FilterTab({ active, onClick, label, icon: Icon, activeClass = "bg-sakura-cocoa text-white" }: { active: boolean, onClick: () => void, label: string, icon?: any, activeClass?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center gap-3 border",
                active
                    ? activeClass + " shadow-lg"
                    : "bg-white text-sakura-cocoa/40 hover:bg-sakura-bg-app border-sakura-divider"
            )}
        >
            {Icon && <Icon size={14} />}
            {label}
        </button>
    );
}

function SectionHeader({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <div className="mb-8 pl-1">
            <h2 className="text-xl font-black text-sakura-ink uppercase tracking-tighter mb-1">{title}</h2>
            <div className="flex items-center gap-3">
                <div className="h-0.5 w-12 bg-sakura-cocoa/10" />
                <p className="text-[10px] text-sakura-cocoa/40 font-black uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
        </div>
    );
}
