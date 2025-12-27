
'use client';

import React, { useState } from 'react';
import { SakuraHeader } from '@/ui/components/sakura/SakuraHeader';
import { HanaButton } from '@/ui/components/hana/Button';
import { Plus, Layers } from 'lucide-react';
import { HanaCard } from '@/ui/components/hana/Card';

export default function DecksPage() {
    const [decks, setDecks] = useState<any[]>([
        { id: '1', name: 'Core 2K', count: 2000 },
        { id: '2', name: 'Genki I', count: 350 }
    ]);
    const [isCreating, setIsCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');

    const handleCreate = () => {
        if (!newDeckName.trim()) return;
        setDecks([...decks, { id: Date.now().toString(), name: newDeckName, count: 0 }]);
        setNewDeckName('');
        setIsCreating(false);
    };

    return (
        <div data-testid="decks-ready" className="min-h-screen bg-transparent pb-20">
            <SakuraHeader
                title="Deck Matrix"
                subtitle="Manage your knowledge repositories"
                subtitleColor="#F43F5E"
                actions={
                    <HanaButton onClick={() => setIsCreating(true)}>
                        <Plus size={18} /> New Deck
                    </HanaButton>
                }
            />

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
                {isCreating && (
                    <div className="p-6 bg-white rounded-2xl border border-sakura-divider mb-8 animate-in slide-in-from-top-4">
                        <div className="flex gap-4">
                            <input
                                data-testid="deck-name-input"
                                type="text"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                placeholder="Enter deck name..."
                                className="flex-1 px-4 py-2 border border-sakura-divider rounded-xl outline-none focus:border-sakura-pink"
                            />
                            <HanaButton onClick={handleCreate}>Create</HanaButton>
                            <HanaButton variant="ghost" onClick={() => setIsCreating(false)}>Cancel</HanaButton>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map(deck => (
                        <HanaCard key={deck.id} variant="clay" className="group cursor-pointer hover:scale-[1.02]">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center mb-2">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="font-black text-lg text-sakura-ink">{deck.name}</h3>
                                    <p className="text-xs font-bold text-sakura-cocoa/40 uppercase tracking-widest">{deck.count} CARDS</p>
                                </div>
                            </div>
                        </HanaCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
