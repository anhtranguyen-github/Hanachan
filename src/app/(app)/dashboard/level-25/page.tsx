'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { Play, ChevronRight } from 'lucide-react';

export default function DeckLevel25Page() {
    const router = useRouter();

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors">
                        <ChevronRight className="rotate-180 w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Level Deck</span>
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">10 CARDS</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Level 25</h1>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-full px-6 border-slate-300 font-bold text-slate-600 hover:bg-slate-50">
                        + ADD CARDS
                    </Button>
                    <Button className="rounded-full px-8 btn-primary font-bold text-white shadow-lg shadow-rose-200" onClick={() => router.push('/study/deck-1')}>
                        <Play fill="currentColor" className="w-4 h-4 mr-2" /> STUDY NOW
                        <div className="ml-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px]">10</div>
                    </Button>
                </div>
            </div>

            {/* Description Card */}
            <div className="app-card p-10 bg-gradient-to-r from-rose-50/50 to-white">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4">About This Level</h3>
                <p className="text-xl font-medium text-slate-800">This is a mock deck for demonstration.</p>
            </div>

            {/* Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="app-card p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deck Progress</h3>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-400">120 total cards</span>
                            <span className="text-xs font-bold text-orange-500">10 due today</span>
                        </div>
                    </div>
                    <div className="text-5xl font-black text-slate-900 mb-6">67%</div>

                    {/* Multi-colored Progress Bar */}
                    <div className="h-4 w-full rounded-full flex overflow-hidden mb-6">
                        <div className="bg-emerald-400 w-[35%]"></div>
                        <div className="bg-sky-400 w-[20%]"></div>
                        <div className="bg-amber-400 w-[15%]"></div>
                        <div className="bg-slate-200 flex-1"></div>
                    </div>

                    <div className="flex justify-between gap-4 text-xs">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-wider text-[10px]"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Mastered</div>
                            <span className="font-bold text-lg pl-4">35</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-wider text-[10px]"><div className="w-2 h-2 rounded-full bg-sky-400"></div> Review</div>
                            <span className="font-bold text-lg pl-4">45</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-wider text-[10px]"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Learning</div>
                            <span className="font-bold text-lg pl-4">25</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-wider text-[10px]"><div className="w-2 h-2 rounded-full bg-slate-200"></div> New</div>
                            <span className="font-bold text-lg pl-4">15</span>
                        </div>
                    </div>
                </div>

                <div className="app-card p-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Review Forecast (7 Days)</h3>
                    <div className="h-[180px] flex items-end justify-between px-4">
                        {[20, 45, 10, 80, 50, 30, 15].map((val, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group">
                                <div style={{ height: `${val}%` }} className="w-8 bg-rose-100 rounded-t-lg group-hover:bg-rose-300 transition-colors relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {val} cards
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
