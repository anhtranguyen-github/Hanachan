
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { Search, Filter, BookOpen, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';

const SRS_STAGES: Record<string, { label: string, color: string }> = {
    'new': { label: 'New', color: 'bg-gray-100 text-gray-600 border-gray-300' },
    'learning': { label: 'Learning', color: 'bg-blue-100 text-blue-600 border-blue-300' },
    'review': { label: 'Review', color: 'bg-green-100 text-green-600 border-green-300' },
    'relearning': { label: 'Relearn', color: 'bg-orange-100 text-orange-600 border-orange-300' },
    'burned': { label: 'Burned', color: 'bg-purple-100 text-purple-600 border-purple-300' },
};

const JLPT_LEVELS = [
    { id: 'N5', name: 'N5', range: [1, 10] },
    { id: 'N4', name: 'N4', range: [11, 20] },
    { id: 'N3', name: 'N3', range: [21, 35] },
    { id: 'N2', name: 'N2', range: [36, 50] },
    { id: 'N1', name: 'N1', range: [51, 60] },
];

export default function VocabLibraryPage() {
    const { user } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedJLPT, setSelectedJLPT] = useState('N5');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [loading, setLoading] = useState(true);

    const jlpt = JLPT_LEVELS.find(l => l.id === selectedJLPT)!;

    useEffect(() => {
        if (user) {
            setLoading(true);
            MockDB.fetchLevelContent(currentLevel, user.id).then((res) => {
                setItems(res.filter(item => item.type === 'vocabulary'));
                setLoading(false);
            });
        }
    }, [user, currentLevel]);

    const handleJLPTChange = (id: string) => {
        const level = JLPT_LEVELS.find(l => l.id === id)!;
        setSelectedJLPT(id);
        setCurrentLevel(level.range[0]);
    };

    const filteredItems = items.filter(item =>
        item.character?.includes(search) ||
        item.meaning?.toLowerCase().includes(search.toLowerCase()) ||
        item.ku_vocabulary?.reading_primary?.includes(search)
    );

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Vocabulary</h1>
                    <p className="text-primary-dark/70 font-bold">Your word bank and learning stages.</p>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 p-1.5 bg-primary-dark/5 rounded-clay border-2 border-primary-dark/5">
                            {JLPT_LEVELS.map((l) => (
                                <button
                                    key={l.id}
                                    onClick={() => handleJLPTChange(l.id)}
                                    className={clsx(
                                        "px-6 py-2 rounded-clay font-black transition-all",
                                        selectedJLPT === l.id
                                            ? "bg-primary text-white shadow-clay scale-105"
                                            : "text-primary-dark/40 hover:text-primary"
                                    )}
                                >
                                    {l.id}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/40" />
                            <input
                                type="text"
                                placeholder="Search vocabulary..."
                                className="clay-input pl-10 h-11 w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-clay border-2 border-primary-dark/10 overflow-x-auto no-scrollbar">
                        <span className="text-[10px] font-black uppercase text-primary-dark/40 px-3 whitespace-nowrap">Level Roadmap:</span>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: jlpt.range[1] - jlpt.range[0] + 1 }, (_, i) => jlpt.range[0] + i).map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setCurrentLevel(lvl)}
                                    className={clsx(
                                        "w-8 h-8 min-w-[32px] rounded-lg font-black text-xs transition-all flex items-center justify-center",
                                        currentLevel === lvl
                                            ? "bg-primary-dark text-white border-2 border-primary shadow-clay-sm"
                                            : "text-primary-dark/40 hover:bg-primary/5"
                                    )}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 clay-card animate-pulse bg-primary/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => {
                        const state = item.user_learning_states?.[0] || { state: 'new' };
                        const stage = SRS_STAGES[state.state];
                        const char = item.character;

                        return (
                            <Link
                                href={`/content/vocabulary/${encodeURIComponent(char)}`}
                                key={item.id}
                                className="clay-card p-4 flex items-center justify-between group transition-all hover:-translate-y-1 hover:bg-primary/5 active:scale-95"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 flex items-center justify-center bg-primary/5 rounded-clay border-2 border-primary-dark text-2xl font-black text-primary-dark">
                                        {item.character}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary opacity-60 text-xs uppercase tracking-tighter">
                                                {item.ku_vocabulary?.reading_primary}
                                            </span>
                                            <Volume2 className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="font-black text-lg text-primary-dark capitalize">{item.meaning}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 ${stage.color}`}>
                                        {stage.label}
                                    </span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div
                                                key={s}
                                                className={`w-2 h-2 rounded-full border-[1px] border-primary-dark ${s <= (state.srs_stage || 0) ? 'bg-primary' : 'bg-white'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="clay-card p-12 text-center text-primary-dark/50 font-bold">
                    No vocabulary found matching your search.
                </div>
            )}
        </div>
    );
}
