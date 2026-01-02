'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { Play, Search, Filter, BookOpen, Layers, Sparkles, Plus } from 'lucide-react';
import { PageHeader } from '@/ui/components/PageHeader';
import { cn } from '@/lib/utils';

const ALL_DECKS = [
    {
        id: 'n5-core',
        title: 'JLPT N5 Core',
        description: 'Common words and grammar for N5 level.',
        count: 800,
        type: 'official',
        color: 'rose'
    },
    {
        id: 'n4-core',
        title: 'JLPT N4 Core',
        description: 'Next step after N5, intermediate beginner.',
        count: 1500,
        type: 'official',
        color: 'blue'
    },
    {
        id: 'mining',
        title: 'YouTube Mining',
        description: 'Cards added from immersion videos.',
        count: 124,
        type: 'custom',
        color: 'purple'
    },
    {
        id: 'level-25',
        title: 'Level 25',
        description: 'Your current progress deck.',
        count: 50,
        type: 'progress',
        color: 'rose'
    }
];

export default function DecksPage() {
    const router = useRouter();

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <PageHeader
                title="Browse Decks"
                subtitle="Manage and study your collections"
                icon={Layers}
                iconColor="text-rose-500"
                action={
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none w-64 shadow-sm" placeholder="Search decks..." />
                    </div>
                }
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatBox label="Total Decks" value="12" />
                <StatBox label="Total Cards" value="2,456" />
                <StatBox label="Due Today" value="48" color="text-rose-500" />
                <StatBox label="New Cards" value="15" color="text-blue-500" />
            </div>

            {/* Deck Filters */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                <button className="text-sm font-bold text-rose-500 border-b-2 border-rose-500 pb-2 px-2">All Decks</button>
                <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-2 px-2">Official</button>
                <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-2 px-2">Custom</button>
                <div className="ml-auto">
                    <Button variant="ghost" size="sm" className="text-slate-500 font-bold">
                        <Filter className="w-4 h-4 mr-2" /> Sort By
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALL_DECKS.map((deck) => (
                    <div key={deck.id} className="app-card p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-100 cursor-pointer"
                        onClick={() => router.push(deck.id === 'level-25' ? '/dashboard/level-25' : `/decks/${deck.id}`)}>

                        <div className={`h-3 gear-bg-${deck.color}`}></div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={cn("px-2 py-0.5 text-[10px] font-black uppercase rounded",
                                        deck.type === 'official' ? 'bg-blue-100 text-blue-600' :
                                            deck.type === 'custom' ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600')}>
                                        {deck.type}
                                    </span>
                                    <h3 className="text-xl font-black text-slate-800 mt-2">{deck.title}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:bg-rose-50 transition-colors">
                                    <BookOpen size={20} />
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 line-clamp-2 h-10 leading-relaxed">
                                {deck.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-xs font-bold text-slate-400">{deck.count} cards</span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-50 text-slate-400">
                                        <Plus size={14} />
                                    </Button>
                                    <Button size="sm" className="h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white font-bold text-xs"
                                        onClick={(e) => { e.stopPropagation(); router.push(`/study/${deck.id}`) }}>
                                        <Play size={12} className="mr-1" /> Study
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Create New Placeholder */}
                <div className="app-card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 bg-slate-50/50 hover:bg-white hover:border-rose-200 transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:scale-110 transition-all mb-4">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-slate-500 group-hover:text-rose-500">Create New Deck</span>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, color = "text-slate-800" }: { label: string, value: string, color?: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className={cn("text-xl font-black", color)}>{value}</div>
        </div>
    );
}
