'use client';

import React, { useState, useEffect } from 'react';
import { 
    Layers, 
    Plus, 
    Search, 
    Settings2, 
    Trash2, 
    ExternalLink, 
    Info, 
    CheckCircle2, 
    XCircle,
    BookOpen,
    Globe,
    User,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { listDecksAction, toggleDeckAction, createDeckAction, deleteDeckAction } from '@/features/decks/actions';
import { useUser } from '@/features/auth/AuthContext';
import { BaseModal } from '@/components/shared/BaseModal';

export default function DecksPage() {
    const { user } = useUser();
    const [decks, setDecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDeck, setNewDeck] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    const loadDecks = async () => {
        setLoading(true);
        const res = await listDecksAction() as any;
        if (res.success) {
            setDecks(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) loadDecks();
    }, [user]);

    const handleToggle = async (deckId: string, currentStatus: boolean) => {
        const res = await toggleDeckAction(deckId, !currentStatus) as any;
        if (res.success) {
            setDecks(prev => prev.map(d => d.id === deckId ? { ...d, is_enabled: !currentStatus } : d));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const res = await createDeckAction(newDeck.name, newDeck.description) as any;
        if (res.success) {
            setIsCreateModalOpen(false);
            setNewDeck({ name: '', description: '' });
            loadDecks();
        }
        setCreating(false);
    };

    const filteredDecks = decks.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading && decks.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Syncing Workspace...</p>
            </div>
        );
    }

    return (
        <main className="max-w-[1400px] mx-auto space-y-8 animate-page-entrance">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white shadow-lg">
                            <Layers size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-[#3E4A61] tracking-tighter">Deck Manager</h1>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] ml-13">
                        Organize your learning workspace • {decks.length} Decks Found
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBD5E0]" size={16} />
                        <input 
                            type="text" 
                            placeholder="SEARCH DECKS OR COLLECTIONS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-md border border-gray-100 rounded-2xl text-[10px] font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-[#D88C9A] text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-primary/25 hover:scale-105 transition-all flex items-center gap-2 shrink-0"
                    >
                        <Plus size={16} />
                        <span>Create Deck</span>
                    </button>
                </div>
            </header>

            {/* Grid Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDecks.map((deck) => (
                    <div 
                        key={deck.id}
                        className={clsx(
                            "group glass-card p-6 flex flex-col gap-6 transition-all duration-500 border-2 relative overflow-hidden h-full",
                            deck.is_enabled ? "border-primary/5 hover:border-primary/20 shadow-md hover:shadow-xl" : "border-gray-100/50 opacity-80 grayscale-[0.5] hover:grayscale-0"
                        )}
                    >
                        {/* Status Glow */}
                        {deck.is_enabled && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -mr-8 -mt-8 animate-pulse-slow" />
                        )}

                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500",
                                    deck.is_system ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                                )}>
                                    {deck.is_system ? <Globe size={24} /> : <User size={24} />}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-[#3E4A61] tracking-tight truncate max-w-[140px]">{deck.name}</h3>
                                        {deck.is_system && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest">Official</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">
                                        {deck.is_system ? 'Standard Curriculum' : 'Custom Collection'}
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleToggle(deck.id, deck.is_enabled)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all duration-300 border flex items-center gap-2 shadow-sm",
                                    deck.is_enabled 
                                        ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" 
                                        : "bg-gray-50 border-gray-100 text-[#A0AEC0] hover:bg-gray-100"
                                )}
                            >
                                {deck.is_enabled ? (
                                    <>
                                        <CheckCircle2 size={12} />
                                        <span>Active</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={12} />
                                        <span>Inactive</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-[#3E4A61]/70 leading-relaxed min-h-[48px] line-clamp-3 relative z-10">
                            {deck.description || "No detailed description provided for this collection."}
                        </p>

                        <div className="pt-6 border-t border-gray-100 mt-auto flex items-center justify-between relative z-10">
                            <div className="flex gap-4">
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">Mastery</span>
                                    <div className="text-sm font-black text-[#3E4A61]">0%</div>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">Due</span>
                                    <div className="text-sm font-black text-[#3E4A61]">0</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Link 
                                    href={`/dashboard?deck_id=${deck.id}`}
                                    className="p-2.5 rounded-xl bg-gray-50 text-[#A0AEC0] hover:bg-primary/10 hover:text-primary transition-all group/btn"
                                    title="View Statistics"
                                >
                                    <Settings2 size={16} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                                </Link>
                                <Link 
                                    href={`/decks/${deck.id}`}
                                    className="p-2.5 rounded-xl bg-gray-50 text-[#A0AEC0] hover:bg-primary/10 hover:text-primary transition-all"
                                    title="Examine Deck"
                                >
                                    <ExternalLink size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            <BaseModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Custom Deck"
            >
                <form onSubmit={handleCreate} className="space-y-6 pt-2">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0] ml-1">Deck Name</label>
                            <input 
                                required
                                type="text"
                                value={newDeck.name}
                                onChange={(e) => setNewDeck(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="E.G. JLPT N5 VOCABULARY"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0] ml-1">Description</label>
                            <textarea 
                                rows={3}
                                value={newDeck.description}
                                onChange={(e) => setNewDeck(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="WHAT'S THIS DECK FOR?"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#A0AEC0] hover:bg-gray-50 transition-all border border-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={creating}
                            className="flex-2 py-4 px-10 bg-gradient-to-r from-primary to-[#D88C9A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create Deck Collection'}
                        </button>
                    </div>
                </form>
            </BaseModal>
        </main>
    );
}
