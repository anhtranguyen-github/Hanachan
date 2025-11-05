'use client';

import React, { useState } from 'react';
import { X, Volume2, Bookmark, Plus, Share2, ExternalLink, Sparkles, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/features/analysis/hooks/AnalysisContext';
import type { JLPTLevel } from '@/types/commonTypes';

interface EntryData {
    word: string;
    reading: string;
    meanings: string[];
    jlptLevel?: JLPTLevel;
    examples?: Array<{ ja: string; en: string }>;
}

const JLPT_COLORS: Record<JLPTLevel, string> = {
    N5: 'bg-green-100 text-green-700 border-green-200',
    N4: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    N3: 'bg-blue-100 text-blue-700 border-blue-200',
    N2: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    N1: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const WordDetailModal = React.memo(function WordDetailModal() {
    const { selectedWord, setSelectedWord } = useAnalysis();
    const [activeTab, setActiveTab] = useState<'dictionary' | 'hierarchy'>('dictionary');
    const [entry, setEntry] = useState<EntryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Mock fetching dictionary data when selectedWord changes
    React.useEffect(() => {
        if (selectedWord) {
            setIsLoading(true);
            // Simulate API lookup
            setTimeout(() => {
                setEntry({
                    word: selectedWord.surface,
                    reading: selectedWord.reading || selectedWord.surface,
                    meanings: ['Definition 1 of ' + selectedWord.surface, 'Definition 2 of ' + selectedWord.surface],
                    jlptLevel: selectedWord.jlptLevel,
                    examples: [
                        { ja: selectedWord.surface + 'を使った例文です。', en: 'This is an example sentence using ' + selectedWord.surface + '.' }
                    ]
                });
                setIsLoading(false);
            }, 300);
        } else {
            setEntry(null);
        }
    }, [selectedWord]);

    if (!selectedWord) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-lg rounded-[2.5rem] border border-sakura-divider overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative p-8 pb-4">
                    <button
                        onClick={() => setSelectedWord(null)}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-sakura-bg-soft text-sakura-text-muted transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="text-6xl font-black font-jp text-sakura-text-primary mb-2">
                            {selectedWord.surface}
                        </div>
                        <div className="text-2xl font-bold text-sakura-accent-primary mb-4">
                            {selectedWord.reading || selectedWord.surface}
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            {selectedWord.jlptLevel && (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    JLPT_COLORS[selectedWord.jlptLevel]
                                )}>
                                    {selectedWord.jlptLevel}
                                </span>
                            )}
                            <span className="px-3 py-1 bg-sakura-bg-soft text-sakura-text-muted rounded-full text-[10px] font-black uppercase tracking-widest border border-sakura-divider">
                                {selectedWord.pos || 'VOCABULARY'}
                            </span>
                        </div>

                        {/* Primary Actions */}
                        <div className="flex items-center gap-3 w-full">
                            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-sakura-accent-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-sakura-accent-primary/90 transition-all active:scale-95 ">
                                <Plus size={16} strokeWidth={3} />
                                Add to Deck
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-sakura-bg-soft text-sakura-text-secondary rounded-2xl font-black text-[11px] uppercase tracking-widest border border-sakura-divider hover:bg-white transition-all active:scale-95">
                                <Bookmark size={16} strokeWidth={3} />
                                Bookmark
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-sakura-divider px-8">
                    <button
                        onClick={() => setActiveTab('dictionary')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                            activeTab === 'dictionary'
                                ? "border-sakura-accent-primary text-sakura-accent-primary bg-sakura-accent-primary/5"
                                : "border-transparent text-sakura-text-muted hover:text-sakura-text-secondary"
                        )}
                    >
                        <X size={14} className="rotate-45" /> {/* Use as dictionary icon placeholder */}
                        Dictionary
                    </button>
                    <button
                        onClick={() => setActiveTab('hierarchy')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                            activeTab === 'hierarchy'
                                ? "border-sakura-accent-primary text-sakura-accent-primary bg-sakura-accent-primary/5"
                                : "border-transparent text-sakura-text-muted hover:text-sakura-text-secondary"
                        )}
                    >
                        <Network size={14} />
                        Hierarchy
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 h-[400px] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-4 border-sakura-divider border-t-sakura-accent-primary rounded-full animate-spin" />
                        </div>
                    ) : activeTab === 'dictionary' ? (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Definitions */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-text-muted mb-4 flex items-center gap-2">
                                    <Sparkles size={12} /> Semantic Meanings
                                </h4>
                                <ol className="space-y-4">
                                    {entry?.meanings.map((m, i) => (
                                        <li key={i} className="flex gap-4">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-sakura-accent-primary/10 text-sakura-accent-primary rounded-lg text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            <p className="text-sakura-text-primary text-lg font-medium leading-tight">
                                                {m}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Examples */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-text-muted mb-4">Contextual Examples</h4>
                                <div className="space-y-3">
                                    {entry?.examples.map((ex, i) => (
                                        <div key={i} className="p-5 rounded-3xl bg-sakura-bg-soft border border-sakura-divider group hover:border-sakura-accent-primary/20 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xl font-jp font-bold text-sakura-text-primary group-hover:text-sakura-accent-primary transition-colors">
                                                    {ex.ja}
                                                </p>
                                                <button className="p-2 hover:bg-white rounded-xl transition-colors text-sakura-text-muted">
                                                    <Volume2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-sakura-text-muted leading-relaxed">
                                                {ex.en}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            {/* Simplified Hierarchy / Related Words */}
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-text-muted mb-6">Lexical Relationships</h4>
                            <div className="space-y-4">
                                <div className="p-6 rounded-3xl border-2 border-sakura-accent-primary bg-sakura-accent-primary/5 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-sakura-accent-primary mb-2 block">Base Form</span>
                                    <p className="text-3xl font-jp font-black">{selectedWord.surface}</p>
                                </div>
                                <div className="flex justify-center py-2">
                                    <div className="w-px h-8 bg-sakura-divider" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-sakura-divider bg-white hover:border-sakura-accent-primary/40 transition-all cursor-pointer text-center">
                                        <span className="text-[9px] font-black uppercase text-sakura-text-muted mb-1 block">Polite</span>
                                        <p className="text-lg font-jp font-bold text-sakura-text-primary">···ます</p>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-sakura-divider bg-white hover:border-sakura-accent-primary/40 transition-all cursor-pointer text-center">
                                        <span className="text-[9px] font-black uppercase text-sakura-text-muted mb-1 block">Te-Form</span>
                                        <p className="text-lg font-jp font-bold text-sakura-text-primary">···て</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-4 bg-sakura-bg-soft border-t border-sakura-divider flex items-center justify-between">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sakura-text-muted hover:text-sakura-accent-primary transition-colors">
                        <Share2 size={14} />
                        Share Insight
                    </button>
                    <a href="#" target="_blank" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sakura-text-muted hover:text-sakura-accent-primary transition-colors">
                        Jisho.org <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
});
