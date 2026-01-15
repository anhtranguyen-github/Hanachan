
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { Search, Filter, BookText } from 'lucide-react';

const SRS_STAGES: Record<string, { label: string, color: string }> = {
    'new': { label: 'New', color: 'bg-gray-100 text-gray-600 border-gray-300' },
    'learning': { label: 'Learning', color: 'bg-blue-100 text-blue-600 border-blue-300' },
    'review': { label: 'Review', color: 'bg-green-100 text-green-600 border-green-300' },
    'relearning': { label: 'Relearn', color: 'bg-orange-100 text-orange-600 border-orange-300' },
    'burned': { label: 'Burned', color: 'bg-purple-100 text-purple-600 border-purple-300' },
};

export default function GrammarLibraryPage() {
    const { user } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user) {
            MockDB.fetchLevelContent(1, user.id).then((res) => {
                setItems(res.filter(item => item.type === 'grammar'));
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
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">Grammar</h1>
                    <p className="text-primary-dark/70 font-bold">Structural patterns and usage rules.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/40" />
                        <input
                            type="text"
                            placeholder="Search grammar..."
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

            <div className="flex flex-col gap-4">
                {filteredItems.map((item) => {
                    const state = item.user_learning_states?.[0] || { state: 'new' };
                    const stage = SRS_STAGES[state.state];

                    return (
                        <Link
                            href={`/content/grammar/${encodeURIComponent(item.character)}`}
                            key={item.id}
                            className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all hover:bg-primary/5 active:scale-[0.98]"
                        >
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl font-black text-primary-dark">{item.character}</div>
                                    <div className="px-3 py-1 bg-primary/10 text-primary-dark text-xs font-black rounded-full border-2 border-primary-dark">N5</div>
                                </div>
                                <div className="font-bold text-primary-dark/80">{item.meaning}</div>
                                <p className="text-sm text-primary-dark/60 mt-2 line-clamp-1 italic">
                                    “{item.ku_grammar?.details || 'Usage explanation here...'}”
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-3 min-w-[120px]">
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
                    )
                })}
            </div>

            {filteredItems.length === 0 && (
                <div className="clay-card p-12 text-center text-primary-dark/50 font-bold">
                    No grammar found matching your search.
                </div>
            )}
        </div>
    );
}
