"use client";

import React from 'react';
import { GrammarMatch } from '@/types/ai.types';

interface GrammarPanelProps {
    matches: GrammarMatch[];
}

export function GrammarPanel({ matches }: GrammarPanelProps) {
    if (matches.length === 0) {
        return (
            <div className="p-10 text-sakura-text-muted/80 text-[10px] font-black uppercase tracking-widest text-center border-2 border-dashed border-sakura-divider rounded-[2rem] bg-sakura-bg-soft/30 h-full flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                    <Sparkles className="text-sakura-cocoa/40" size={24} />
                </div>
                No patterns detected
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-sakura-cocoa/70 uppercase tracking-widest flex items-center gap-2">
                    <Languages size={14} /> Grammar Matches
                </h3>
                <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-lg">
                    {matches.length}
                </span>
            </div>

            <div className="space-y-3">
                {matches.map((match) => (
                    <div
                        key={match.id}
                        className="p-6 bg-white border border-sakura-divider rounded-[2rem] hover:border-sakura-accent-primary/50 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="font-black text-sakura-ink text-xl tracking-tighter uppercase">{match.title}</h4>
                            <div className="flex gap-2">
                                {match.jlpt && (
                                    <span className="px-2 py-1 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        JLPT N{match.jlpt}
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        match.confidence > 0.8 ? 'bg-green-50 border-green-200 text-green-700' :
                                            match.confidence > 0.5 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                                'bg-sakura-bg-soft border-sakura-divider text-sakura-text-muted'
                                    )}
                                    title="Confidence Score"
                                >
                                    {Math.round(match.confidence * 100)}% Match
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-black text-sakura-cocoa/70 uppercase tracking-widest bg-sakura-bg-soft/50 px-4 py-2 rounded-xl border border-sakura-divider">
                            <CheckCircle size={12} className="text-sakura-accent-primary" />
                            Detected: <span className="text-sakura-ink">&quot;{match.matched_surface}&quot;</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

import { Sparkles, Languages, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
