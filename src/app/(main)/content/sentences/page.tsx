
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { Search, Plus, ExternalLink, MessageCircle, X, Sparkles, Wand2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function SentencesLibraryPage() {
    const { user } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSentence, setNewSentence] = useState({ text_ja: '', text_en: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    const loadSentences = async () => {
        // Fetch from MockDB
        const allSentences = await MockDB.getAllSentences();
        setItems(allSentences);
    };

    useEffect(() => {
        if (user) {
            loadSentences();
        }
    }, [user]);

    const handleAdd = async () => {
        if (!newSentence.text_ja.trim() || !user) return;

        await MockDB.createSentence({
            ...newSentence,
            origin: 'user',
            created_by: user.id
        });

        setNewSentence({ text_ja: '', text_en: '' });
        setShowAddModal(false);
        loadSentences();
    };

    const simulateAIResize = async () => {
        if (!newSentence.text_ja) return;
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 1000));
        // Mock optimization
        if (newSentence.text_ja === 'ねこ') {
            setNewSentence({ ...newSentence, text_ja: '猫は庭で遊んでいます。', text_en: 'The cat is playing in the garden.' });
        } else {
            setNewSentence({ ...newSentence, text_en: 'Auto-translated text from AI...' });
        }
        setIsGenerating(false);
    };

    const filteredItems = items.filter(item =>
        item.text_ja?.includes(search) ||
        item.text_en?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Sentences</h1>
                    <p className="text-primary-dark/70 font-bold">Real-world usage and mined examples.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/40" />
                        <input
                            type="text"
                            placeholder="Search phrases..."
                            className="clay-input pl-10 h-11 py-0 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="clay-btn h-11 bg-primary text-white"
                    >
                        <Plus className="w-5 h-5" />
                        Add New
                    </button>
                </div>
            </header>

            <div className="flex flex-col gap-6">
                {filteredItems.map((item) => (
                    <Link
                        href={`/content/sentences/${item.id}`}
                        key={item.id}
                        className="clay-card p-6 flex flex-col gap-4 border-l-8 border-l-primary group hover:-translate-y-1 transition-all active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-2xl font-black text-primary-dark leading-relaxed">
                                {item.text_ja}
                            </div>
                            <div className="flex gap-2">
                                {item.origin === 'chat' && (
                                    <span className="p-1 px-2 bg-purple-100 text-purple-700 text-[10px] font-black uppercase rounded border-2 border-purple-500">
                                        Mined from Chat
                                    </span>
                                )}
                                {item.origin === 'youtube' && (
                                    <span className="p-1 px-2 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded border-2 border-red-500">
                                        YouTube
                                    </span>
                                )}
                                {item.origin === 'user' && (
                                    <span className="p-1 px-2 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded border-2 border-blue-500">
                                        Custom
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-lg font-bold text-primary-dark opacity-70 italic">
                            {item.text_en}
                        </div>

                        <div className="flex items-center justify-between border-t-2 border-primary-dark/5 pt-4 mt-2">
                            <div className="flex gap-2">
                                <div className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    Analyze
                                </div>
                                <div className="w-px h-4 bg-primary-dark/10" />
                                <div className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                                    <ExternalLink className="w-4 h-4" />
                                    View Source
                                </div>
                            </div>
                            <div className="text-[10px] font-black uppercase text-primary-dark/40 tracking-wider">
                                {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-lg w-full bg-white p-8 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full text-primary-dark/30"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-clay border-2 border-primary border-dashed flex items-center justify-center text-primary">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-primary-dark">Add New Sentence</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase text-primary-dark/40 ml-1">Japanese Text</label>
                                        <button
                                            onClick={simulateAIResize}
                                            disabled={isGenerating || !newSentence.text_ja}
                                            className="text-[10px] font-black text-secondary hover:underline flex items-center gap-1 uppercase tracking-widest disabled:opacity-30"
                                        >
                                            <Wand2 className="w-3 h-3" />
                                            AI Optimize
                                        </button>
                                    </div>
                                    <textarea
                                        className="clay-input min-h-[100px] py-4"
                                        placeholder="例：昨日の晩御飯はとても美味しかったです。"
                                        value={newSentence.text_ja}
                                        onChange={(e) => setNewSentence({ ...newSentence, text_ja: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-primary-dark/40 ml-1">English Translation</label>
                                    <textarea
                                        className="clay-input min-h-[80px] py-4"
                                        placeholder="Example: Last night's dinner was very delicious."
                                        value={newSentence.text_en}
                                        onChange={(e) => setNewSentence({ ...newSentence, text_en: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleAdd}
                                    disabled={!newSentence.text_ja.trim()}
                                    className="clay-btn bg-primary py-4 text-white disabled:opacity-50"
                                >
                                    Save to Library
                                </button>
                                <p className="text-[10px] text-center font-bold text-primary-dark/30 uppercase tracking-[0.2em] mt-2">
                                    Mined sentences are automatically synced across devices
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
