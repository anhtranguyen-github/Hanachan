
'use client';

import React, { useState } from 'react';
import { Search, Eraser, FileText, Zap, Save, X, BookOpen, Volume2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { QuickViewModal, QuickViewData } from '@/components/shared/QuickViewModal';

export default function AnalyzerPage() {
    const [text, setText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Modal state
    const [quickViewOpen, setQuickViewOpen] = useState(false);
    const [quickViewData, setQuickViewData] = useState<QuickViewData | null>(null);

    const openTokenModal = (token: any) => {
        setQuickViewData({
            type: 'TOKEN',
            title: token.surface,
            meaning: token.meaning,
            reading: token.reading,
            level: token.level || 'N5',
            explanation: token.explanation || `Linguistic entry for "${token.surface}".`,
        });
        setQuickViewOpen(true);
    };

    const openGrammarModal = (g: any) => {
        setQuickViewData({
            type: 'GRAMMAR',
            title: g.point,
            meaning: 'Grammar Point',
            explanation: g.explanation,
            examples: g.example ? [{ ja: g.example, en: 'Example translation' }] : [],
            level: 'N5'
        });
        setQuickViewOpen(true);
    };

    const handleAnalyze = () => {
        if (!text.trim()) return;
        setAnalyzing(true);
        setTimeout(() => {
            const mockResult = {
                tokens: [
                    { surface: '猫', meaning: 'Cat', reading: 'ねこ', type: 'kanji', learned: true, level: 'N5', slug: 'kanji/日' },
                    { surface: 'は', meaning: 'Topic Particle', reading: 'は', type: 'particle', learned: true, explanation: 'Marks the topic of the sentence.' },
                    { surface: '学校', meaning: 'School', reading: 'がっこう', type: 'vocabulary', learned: false, level: 'N5', slug: 'vocabulary/学校' },
                    { surface: 'に', meaning: 'Directional Particle', reading: 'に', type: 'particle', learned: true, explanation: 'Indicates the destination or direction.' },
                    { surface: '行きました', meaning: 'Went (Polite)', reading: 'いきました', type: 'vocabulary', learned: false, level: 'N5', base: '行く' },
                ],
                translation: "The cat went to school.",
                grammar: [
                    { point: 'は (Topic Marker)', explanation: 'The particle は identifies the main topic of your sentence. Think of it as "As for [Topic]...".', example: '私は学生です (As for me, I am a student).' },
                    { point: 'に (Direction)', explanation: 'The particle に shows where someone is going or where something is located.', example: '日本に行きます (I am going to Japan).' },
                ]
            };
            setResult(mockResult);
            setAnalyzing(false);
        }, 1200);
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
            <header className="text-center">
                <h1 className="text-4xl font-black text-primary-dark tracking-tight mb-2">Sentence Analyzer</h1>
                <p className="text-primary-dark/70 font-bold">Deeply understand any Japanese text with one click.</p>
            </header>

            <div className="clay-card p-6 flex flex-col gap-4">
                <textarea
                    className="clay-input min-h-[150px] text-xl font-bold p-6 resize-none"
                    placeholder="Paste your Japanese sentence here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => { setText(''); setResult(null); }}
                        className="flex items-center gap-2 text-primary-dark/40 font-black text-sm hover:text-red-500 transition-colors"
                    >
                        <Eraser className="w-4 h-4" />
                        Clear
                    </button>
                    <button
                        disabled={analyzing || !text.trim()}
                        onClick={handleAnalyze}
                        className="clay-btn bg-secondary disabled:opacity-50 min-w-[160px]"
                    >
                        {analyzing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing...
                            </div>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 fill-current" />
                                Analyze
                            </>
                        )}
                    </button>
                </div>
            </div>

            {result && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="clay-card p-10 bg-white overflow-visible">
                        <div className="flex items-center gap-2 mb-10 text-primary font-black uppercase tracking-widest text-xs">
                            <FileText className="w-4 h-4" />
                            Detailed Breakdown
                        </div>

                        <div className="flex flex-wrap gap-x-2 gap-y-14 py-8">
                            {result.tokens.map((token: any, i: number) => (
                                <div
                                    key={i}
                                    className="relative group cursor-pointer"
                                    onClick={() => openTokenModal(token)}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap">
                                        {token.reading}
                                    </div>
                                    <div className={clsx(
                                        "text-4xl md:text-5xl font-black px-1 border-b-8 pb-1 transition-all group-hover:bg-primary/5 active:scale-95",
                                        token.learned ? 'border-primary' : 'border-primary-dark/10'
                                    )}>
                                        {token.surface}
                                    </div>
                                    <div className="absolute top-full mt-3 left-0 right-0 text-[10px] font-black uppercase text-primary-dark/40 text-center leading-tight tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                        {token.meaning}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 bg-primary/5 rounded-clay border-2 border-primary-dark p-8 border-dashed relative">
                            <div className="absolute -top-3 left-6 bg-white px-3 py-1 border-2 border-primary-dark rounded-full text-[10px] font-black text-primary uppercase shadow-clay">
                                Translation
                            </div>
                            <p className="text-2xl font-black text-primary-dark italic">“{result.translation}”</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="clay-card p-8 border-dashed">
                            <h3 className="font-black text-primary-dark mb-6 flex items-center gap-2 text-lg">
                                <BookOpen className="w-6 h-6 text-primary" />
                                Grammar Highlights
                            </h3>
                            <div className="flex flex-col gap-4">
                                {result.grammar.map((g: any, i: number) => (
                                    <div
                                        key={i}
                                        onClick={() => openGrammarModal(g)}
                                        className="p-5 bg-white border-2 border-primary-dark rounded-clay shadow-clay cursor-pointer hover:-translate-y-1 active:translate-y-0 transition-all hover:bg-primary/5 group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-black text-primary group-hover:text-primary-dark">{g.point}</div>
                                            <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-primary-dark opacity-60 font-bold text-sm line-clamp-2">{g.explanation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="clay-card p-8 bg-primary border-primary-dark flex flex-col items-center justify-center text-center text-white gap-6">
                            <div className="w-20 h-20 bg-white rounded-clay border-4 border-primary-dark flex items-center justify-center shadow-clay">
                                <Save className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl">Capture this insight?</h3>
                                <p className="font-bold text-sm opacity-80 leading-relaxed max-w-[200px]">Save this sentence to your Sentences Library for daily review.</p>
                            </div>
                            <button className="clay-btn bg-secondary w-full border-white/20 py-4 shadow-clay-lg">
                                Save to Library
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick View Modal */}
            <QuickViewModal
                isOpen={quickViewOpen}
                onClose={() => setQuickViewOpen(false)}
                data={quickViewData}
                onAddToDeck={(d) => console.log('Add to deck', d)}
            />
        </div>
    );
}
