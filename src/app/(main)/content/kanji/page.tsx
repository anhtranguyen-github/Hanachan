
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { Search, Filter, BookOpen } from 'lucide-react';

const SRS_STAGES: Record<string, { label: string, color: string }> = {
    'new': { label: 'New', color: 'bg-gray-100 text-gray-600 border-gray-300' },
    'learning': { label: 'Learning', color: 'bg-blue-100 text-blue-600 border-blue-300' },
    'review': { label: 'Review', color: 'bg-green-100 text-green-600 border-green-300' },
    'relearning': { label: 'Relearn', color: 'bg-orange-100 text-orange-600 border-orange-300' },
    'burned': { label: 'Burned', color: 'bg-purple-100 text-purple-600 border-purple-300' },
};

export default function KanjiLibraryPage() {
    const { user } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user) {
            // Fetch level 1 content as a start
            MockDB.fetchLevelContent(1, user.id).then((res) => {
                setItems(res.filter(item => item.type === 'kanji'));
            });
        }
    }, [user]);

    const filteredItems = items.filter(item =>
        item.character?.includes(search) ||
        item.meaning?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Kanji Library</h1>
                    <p className="text-primary-dark/70 font-bold">Manage and track your Kanji progress.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/40" />
                        <input
                            type="text"
                            placeholder="Search Kanji..."
                            className="clay-input pl-10 h-11 py-0 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="clay-btn bg-white !text-primary-dark h-11 px-4">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredItems.map((item) => {
                    const state = item.user_learning_states?.[0] || { state: 'new' };
                    const stage = SRS_STAGES[state.state];
                    const char = item.character;

                    return (
                        <Link
                            href={`/content/kanji/${encodeURIComponent(char)}`}
                            key={item.id}
                            className="clay-card p-0 overflow-hidden flex flex-col group transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="aspect-square flex items-center justify-center bg-white text-6xl font-black text-primary-dark group-hover:bg-primary/5">
                                {item.character}
                            </div>
                            <div className="p-4 bg-background border-t-2 border-primary-dark flex flex-col gap-2">
                                <div className="font-bold text-sm truncate">{item.meaning}</div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 ${stage.color}`}>
                                        {stage.label}
                                    </span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div
                                                key={s}
                                                className={`w-1.5 h-1.5 rounded-full border-[1px] border-primary-dark ${s <= (state.srs_stage || 0) ? 'bg-primary' : 'bg-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <div className="clay-card p-12 text-center text-primary-dark/50 font-bold">
                    No Kanji found matching your search.
                </div>
            )}
        </div>
    );
}
