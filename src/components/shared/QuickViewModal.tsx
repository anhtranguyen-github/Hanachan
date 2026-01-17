
'use client';

import React from 'react';
import { X, Volume2, Plus, Search, BookOpen, Layers, ArrowRight, CheckCircle2, Brain } from 'lucide-react';
import { clsx } from 'clsx';

export type QuickViewType = 'TOKEN' | 'GRAMMAR';

export interface QuickViewData {
    type: QuickViewType;
    title: string;
    subtitle?: string;
    meaning: string;
    reading?: string;
    explanation?: string;
    examples?: { ja: string; en: string }[];
    level?: string;
    ku_type?: string;
    raw?: any;
}

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: QuickViewData | null;
    onAddToDeck?: (data: QuickViewData) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ isOpen, onClose, data, onAddToDeck }) => {
    if (!isOpen || !data) return null;

    const isToken = data.type === 'TOKEN';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="clay-card max-w-lg w-full bg-white p-8 relative animate-in zoom-in-95 duration-200 border-4 border-primary-dark">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full text-primary-dark/30 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "w-12 h-12 rounded-clay border-2 border-primary-dark flex items-center justify-center text-white shadow-clay",
                                isToken ? "bg-primary" : "bg-accent"
                            )}>
                                {isToken ? <Search className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-primary-dark uppercase">
                                    {isToken ? 'Word Analysis' : 'Grammar Note'}
                                </h2>
                                <p className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest">
                                    {data.level ? `Hana-chan ${data.level}` : 'Linguistic Detail'}
                                </p>
                            </div>
                        </div>
                        {data.level && (
                            <span className="bg-primary-dark text-white p-2 rounded px-4 font-black">
                                {data.level}
                            </span>
                        )}
                    </div>

                    {/* Content Display */}
                    <div className="flex flex-col gap-6">
                        <div className="p-8 bg-background rounded-clay border-2 border-primary-dark shadow-inset text-center">
                            <div className="flex flex-col items-center gap-2">
                                {data.reading && (
                                    <span className="text-sm font-black text-primary opacity-60">
                                        {data.reading}
                                    </span>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="text-5xl font-black text-primary-dark">
                                        {data.title}
                                    </span>
                                    {isToken && (
                                        <button className="p-2 bg-white rounded-clay border-2 border-primary-dark shadow-clay-sm hover:scale-110 active:scale-95 transition-all text-primary">
                                            <Volume2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-2xl font-bold text-primary-dark/60 capitalize mt-2 italic shadow-sm">
                                    {data.meaning}
                                </div>
                            </div>
                        </div>

                        {data.explanation && (
                            <div className="flex flex-col gap-1.5 text-left">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest ml-1">Explanation</span>
                                <div className="p-4 bg-white border-2 border-primary-dark rounded-clay font-bold text-primary-dark/80 italic leading-relaxed">
                                    {data.explanation}
                                </div>
                            </div>
                        )}

                        {data.examples && data.examples.length > 0 && (
                            <div className="flex flex-col gap-1.5 text-left">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest ml-1">Context Examples</span>
                                <div className="flex flex-col gap-3">
                                    {data.examples.map((ex, i) => (
                                        <div key={i} className="p-4 bg-white border-2 border-primary-dark rounded-clay shadow-clay-sm hover:-translate-y-1 transition-all">
                                            <p className="font-black text-primary-dark">{ex.ja}</p>
                                            <p className="text-[10px] font-bold text-primary-dark/40 mt-1 italic">{ex.en}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        {isToken ? (
                            <button
                                onClick={() => onAddToDeck && onAddToDeck(data)}
                                className="clay-btn bg-secondary py-4 flex-1 shadow-clay"
                            >
                                <Plus className="w-5 h-5" />
                                Add to Deck
                            </button>
                        ) : (
                            <button className="clay-btn bg-primary py-4 flex-1 text-white shadow-clay">
                                <Brain className="w-5 h-5" />
                                Start Focused Drill
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="clay-btn bg-white !text-primary-dark hover:bg-primary/5 px-6 py-4 shadow-none border-dashed border-2"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
