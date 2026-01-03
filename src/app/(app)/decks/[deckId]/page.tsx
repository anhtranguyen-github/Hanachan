'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMockDataStore } from '@/store/useMockDataStore';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, Play, Plus, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DeckDetailPage() {
    const params = useParams<{ deckId: string }>();
    const router = useRouter();
    const { decks, cards, getDueCards, addCard, deleteCard, updateCard } = useMockDataStore();

    const deck = decks.find(d => d.id === params?.deckId);

    // State for creating/editing cards
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [inputFront, setInputFront] = useState('');
    const [inputBack, setInputBack] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    if (!deck) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold text-slate-700">Deck not found</h2>
                <Link href="/dashboard" className="text-blue-500 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    const deckCards = cards.filter(c => c.deckId === deck.id);
    const dueCards = getDueCards(deck.id);
    const isDue = dueCards.length > 0;

    const handleSaveCard = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputFront.trim() || !inputBack.trim()) return;

        if (editingCardId) {
            updateCard(editingCardId, { front: inputFront, back: inputBack });
            setEditingCardId(null);
        } else {
            addCard(deck.id, inputFront, inputBack);
            // Don't close creation mode immediately to allow mass entry
            setInputFront('');
            setInputBack('');
            // Focus handling could be added here
        }
    };

    const startEditing = (card: any) => {
        setEditingCardId(card.id);
        setInputFront(card.front);
        setInputBack(card.back);
        setIsCreating(true);
    };

    const cancelEdit = () => {
        setEditingCardId(null);
        setInputFront('');
        setInputBack('');
        setIsCreating(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-6">
                <div>
                    <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-slate-600 flex items-center mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Decks
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">{deck.title}</h1>
                    <p className="text-slate-500 mt-1">{deck.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                            Total Cards: <strong>{deckCards.length}</strong>
                        </span>
                        <span className={cn("px-2 py-1 rounded", isDue ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
                            Due for Review: <strong>{dueCards.length}</strong>
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Button
                        size="lg"
                        disabled={!isDue}
                        onClick={() => router.push(`/study/${deck.id}`)}
                        className={cn("w-40 font-bold shadow-sm", isDue ? "animate-pulse" : "opacity-80")}
                    >
                        <Play className="w-5 h-5 mr-2" /> Study Now
                    </Button>
                    {!isDue && deckCards.length > 0 && (
                        <p className="text-xs text-slate-400">All caught up!</p>
                    )}
                </div>
            </div>

            {/* Quick Add Form */}
            {isCreating ? (
                <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-semibold mb-3">{editingCardId ? 'Edit Card' : 'Add New Card'}</h3>
                    <form onSubmit={handleSaveCard} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Front (Question)</label>
                                <textarea
                                    autoFocus
                                    className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 ring-blue-500 outline-none resize-none font-jp"
                                    rows={3}
                                    value={inputFront}
                                    onChange={e => setInputFront(e.target.value)}
                                    placeholder="e.g. 日本"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Back (Answer)</label>
                                <textarea
                                    className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 ring-blue-500 outline-none resize-none"
                                    rows={3}
                                    value={inputBack}
                                    onChange={e => setInputBack(e.target.value)}
                                    placeholder="e.g. Japan"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 text-sm">
                            <Button type="button" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                            <Button type="submit" disabled={!inputFront.trim() || !inputBack.trim()}>
                                {editingCardId ? 'Update Card' : 'Add to Deck'}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <Button variant="outline" className="w-full py-8 border-dashed text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50" onClick={() => setIsCreating(true)}>
                    <Plus className="w-5 h-5 mr-2" /> Add a Card
                </Button>
            )}

            {/* Card List */}
            <div className="space-y-2">
                {deckCards.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        This deck is empty. Add some cards above!
                    </div>
                ) : (
                    deckCards.map((card) => (
                        <div key={card.id} className="group flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-all">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div className="font-jp text-lg font-medium text-slate-800">{card.front}</div>
                                <div className="text-slate-600 border-l pl-4">{card.back}</div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => startEditing(card)}>
                                    <Edit2 className="w-4 h-4 text-slate-400" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:text-red-600"
                                    onClick={() => confirm('Delete card?') && deleteCard(card.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
