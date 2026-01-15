
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import {
    BookOpen,
    Crown,
    User as UserIcon,
    Plus,
    Play,
    BarChart3,
    ChevronRight,
    Zap,
    Clock,
    CheckCircle2,
    X,
    Activity,
    Target,
    Flame
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function DecksPage() {
    const { user } = useUser();
    const [decks, setDecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [newDeckDesc, setNewDeckDesc] = useState('');

    const loadDecks = async () => {
        if (!user) return;
        const rawDecks = await MockDB.getUserDecks(user!.id);
        const enriched = await Promise.all(rawDecks.map(async (d) => {
            const stats = await MockDB.getDeckProgress(user!.id, d.id);
            return { ...d, stats };
        }));
        setDecks(enriched);
        setLoading(false);
    };

    useEffect(() => {
        loadDecks();
    }, [user]);

    const handleCreateDeck = async () => {
        if (!newDeckName.trim() || !user) return;
        setLoading(true);
        await MockDB.createDeck({
            name: newDeckName,
            description: newDeckDesc,
            owner_id: user.id,
            deck_type: 'user'
        });
        setNewDeckName('');
        setNewDeckDesc('');
        setShowCreateModal(false);
        await loadDecks();
    };

    if (loading && decks.length === 0) return <div className="p-12 animate-pulse text-center font-black">Loading your curriculum...</div>;

    const officialDecks = decks.filter(d => d.deck_type === 'system');
    const customDecks = decks.filter(d => d.deck_type === 'user');

    // Calculate Global Stats
    const globalStats = decks.reduce((acc, d) => ({
        due: acc.due + d.stats.due,
        new: acc.new + d.stats.new,
        learned: acc.learned + (d.stats.total - d.stats.new),
        total: acc.total + d.stats.total
    }), { due: 0, new: 0, learned: 0, total: 0 });

    return (
        <div className="flex flex-col gap-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Study Decks</h1>
                    <p className="text-primary-dark/60 font-bold mt-2">Manage your curriculum and track your SRS progress.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="clay-btn bg-secondary py-3 px-6"
                >
                    <Plus className="w-5 h-5" />
                    Create Custom Deck
                </button>
            </header>

            {/* Global Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="clay-card p-6 bg-primary/5 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-primary/10">
                        <Zap className="w-24 h-24 rotate-12" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Total Due</span>
                    <span className="text-4xl font-black text-primary-dark">{globalStats.due}</span>
                    <p className="text-[10px] font-bold text-primary-dark/40">Across all active decks</p>
                </div>
                <div className="clay-card p-6 bg-secondary/5 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-secondary/10">
                        <Target className="w-24 h-24 -rotate-12" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-secondary tracking-widest">New Today</span>
                    <span className="text-4xl font-black text-primary-dark">{globalStats.new}</span>
                    <p className="text-[10px] font-bold text-primary-dark/40">Available to learn</p>
                </div>
                <div className="clay-card p-6 bg-primary/10 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-primary/10">
                        <CheckCircle2 className="w-24 h-24" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary-dark/60 tracking-widest">Learned</span>
                    <span className="text-4xl font-black text-primary-dark">{globalStats.learned}</span>
                    <p className="text-[10px] font-bold text-primary-dark/40">Items currently in SRS</p>
                </div>
            </section>

            {/* Official Decks Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Crown className="w-6 h-6 text-primary fill-current" />
                    <h2 className="text-xl font-black text-primary-dark uppercase tracking-widest">Official Curriculum</h2>
                    <div className="h-1 flex-1 bg-primary-dark/5 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {officialDecks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            </section>

            {/* Custom Decks Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <UserIcon className="w-6 h-6 text-secondary fill-current" />
                    <h2 className="text-xl font-black text-primary-dark uppercase tracking-widest">Your Collections</h2>
                    <div className="h-1 flex-1 bg-primary-dark/5 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {customDecks.length > 0 ? (
                        customDecks.map((deck) => (
                            <DeckCard key={deck.id} deck={deck} />
                        ))
                    ) : (
                        <div className="col-span-full clay-card p-12 bg-white border-dashed text-center">
                            <p className="font-bold text-primary-dark/40 italic">You haven't created any custom decks yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Create Deck Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-md w-full bg-white p-8 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-primary-dark">Create New Deck</h2>
                                <p className="text-sm font-bold text-primary-dark/50">Organize your mined content into custom study sets.</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-primary-dark/40 pl-1">Deck Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. My Favorite Verbs"
                                        className="clay-input py-3"
                                        value={newDeckName}
                                        onChange={(e) => setNewDeckName(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-primary-dark/40 pl-1">Description (Optional)</label>
                                    <textarea
                                        placeholder="What is this deck about?"
                                        className="clay-input py-3 min-h-[100px] resize-none"
                                        value={newDeckDesc}
                                        onChange={(e) => setNewDeckDesc(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateDeck}
                                disabled={!newDeckName.trim() || loading}
                                className="clay-btn w-full py-4 bg-secondary disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Deck'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DeckCard({ deck }: { deck: any }) {
    const { stats } = deck;
    const isStudyable = stats.due > 0 || stats.new > 0;

    return (
        <div className="clay-card p-0 flex flex-col bg-white overflow-hidden group hover:-translate-y-2 transition-all">
            <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase border-2",
                        deck.deck_type === 'system' ? "bg-primary/10 text-primary border-primary" : "bg-secondary/10 text-secondary border-secondary"
                    )}>
                        {deck.deck_type === 'system' ? 'Official' : 'Custom'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary-dark/40 uppercase">
                        <Clock className="w-3 h-3" />
                        Updated {new Date(deck.created_at).toLocaleDateString()}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-black text-primary-dark leading-tight group-hover:text-primary transition-colors">
                        {deck.name}
                    </h3>
                    <p className="text-sm font-bold text-primary-dark/50 line-clamp-2 mt-1 whitespace-pre-wrap">
                        {deck.description}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-y-2 border-primary-dark/5">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-primary-dark">{stats.due}</span>
                        <span className="text-[8px] font-black uppercase text-red-500">Due</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-primary-dark">{stats.new}</span>
                        <span className="text-[8px] font-black uppercase text-secondary">New</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-primary-dark">{stats.total - stats.new}</span>
                        <span className="text-[8px] font-black uppercase text-primary">Learned</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest">Coverage</span>
                        <span className="text-[10px] font-black text-primary">{stats.coverage}%</span>
                    </div>
                    <div className="w-full h-3 bg-primary-dark/10 rounded-full border-2 border-primary-dark overflow-hidden">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${stats.coverage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-background border-t-2 border-primary-dark flex gap-3">
                <Link
                    href={`/learn/${deck.id}/session`}
                    className={clsx(
                        "clay-btn flex-1 py-3 text-sm flex items-center justify-center gap-2",
                        !isStudyable ? "opacity-50 grayscale pointer-events-none" : "bg-primary"
                    )}
                >
                    <Play className="w-4 h-4 fill-current" />
                    {stats.due > 0 ? `Review (${stats.due})` : stats.new > 0 ? 'Start Learning' : 'Complete'}
                </Link>
                <Link
                    href={`/learn/${deck.id}`}
                    className="w-12 h-12 clay-card p-0 flex items-center justify-center bg-white hover:bg-primary/5 shadow-none"
                >
                    <BarChart3 className="w-5 h-5 text-primary-dark/40" />
                </Link>
            </div>
        </div>
    );
}
