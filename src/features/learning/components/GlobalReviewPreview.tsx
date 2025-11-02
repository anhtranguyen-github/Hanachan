'use client';

import React from 'react';
import { ArrowLeft, Play, Flame, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalReviewPreviewProps {
    items: any[];
    onStart: () => void;
    onCancel: () => void;
}

export function GlobalReviewPreview({ items, onStart, onCancel }: GlobalReviewPreviewProps) {
    const totalCount = items.length;
    const typeCounts = items.reduce((acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-sakura-bg-app flex flex-col">
            <header className="bg-white border-b border-sakura-divider px-6 py-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="p-3 rounded-2xl hover:bg-sakura-bg-soft text-sakura-text-muted transition-all border border-sakura-divider"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-sakura-text-primary tracking-tight">Review Session</h1>
                        <p className="text-xs font-black text-sakura-accent-primary uppercase tracking-widest mt-1">Ready to go?</p>
                    </div>
                    <div className="w-11" /> {/* Spacer */}
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Stats Card */}
                    <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 border border-sakura-divider ">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-text-muted mb-2">Session Overview</h2>
                                <p className="text-3xl font-black text-sakura-text-primary">{totalCount} items due</p>
                            </div>
                            <div className="w-16 h-16 bg-sakura-accent-primary/10 rounded-[1.5rem] flex items-center justify-center text-sakura-accent-primary">
                                <Flame size={32} fill="currentColor" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(typeCounts).map(([type, count]) => (
                                <div key={type} className="bg-sakura-bg-soft rounded-2xl p-4 border border-sakura-divider">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted block mb-1">{type}</span>
                                    <span className="text-xl font-black text-sakura-text-primary">{count as React.ReactNode}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-sakura-text-primary rounded-[2.5rem] p-10 text-white flex flex-col justify-between ">
                        <div>
                            <h3 className="text-xl font-black mb-4 leading-tight">Your streak is waiting!</h3>
                            <p className="text-sakura-text-muted font-medium mb-8 text-sm opacity-80">
                                Finish this session to maintain your progress and master these items.
                            </p>
                        </div>
                        <button
                            onClick={onStart}
                            className="w-full py-5 bg-sakura-accent-primary text-white rounded-2xl font-black uppercase tracking-widest  -accent-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Play size={20} fill="currentColor" />
                            Start Now
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-1 bg-sakura-text-primary rounded-full" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-sakura-text-muted">Items in this session</h2>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-sakura-divider overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-sakura-divider">
                            {items.map((item, idx) => (
                                <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-sakura-bg-soft/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl ",
                                            item.content_type === 'RADICAL' ? 'bg-blue-500' :
                                                item.content_type === 'KANJI' ? 'bg-pink-500' : 'bg-purple-500'
                                        )}>
                                            {item.content?.character}
                                        </div>
                                        <div>
                                            <p className="font-black text-sakura-text-primary">{item.content?.meanings?.primary?.[0] || item.content?.meaning}</p>
                                            <p className="text-[10px] font-bold text-sakura-text-muted uppercase tracking-widest">{item.content_type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-sakura-text-muted/50 uppercase tracking-widest">Level {item.content?.level}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
