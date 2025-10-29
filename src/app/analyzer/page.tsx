'use client';

import React, { useState } from 'react';
import { SakuraHeader } from '@/components/SakuraHeader';
import Image from 'next/image';
import { Eraser, Loader2, Wand2, Sparkles, History, Book, Languages, Monitor, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenRenderer } from '@/modules/analysis/components/TokenRenderer';
import { DictionaryPanel } from '@/modules/analysis/components/DictionaryPanel';
import { GrammarPanel } from '@/modules/analysis/components/GrammarPanel';

export default function AnalyzerPage() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [explainMode, setExplainMode] = useState(false);
    const [viewMode, setViewMode] = useState<'dictionary' | 'grammar'>('dictionary');
    const [selectedToken, setSelectedToken] = useState<any>(null);
    const [pinnedHistory, setPinnedHistory] = useState<string[]>(['こんにちは world', '日本語を勉強します']);

    const handleClear = () => {
        setText('');
        setResult(null);
        setError(null);
        setSelectedToken(null);
    };

    const handleAnalyze = async (inputText: string = text) => {
        if (!inputText.trim()) return;
        setLoading(true);
        setError(null);

        try {
            // Mock Analysis
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockResult = {
                tokens: [
                    { surface: '日本', reading: 'にほん', part_of_speech: 'Noun', basic_form: '日本', meaning: 'Japan' },
                    { surface: '語', reading: 'ご', part_of_speech: 'Suffix', basic_form: '語', meaning: 'Language' },
                    { surface: 'を', reading: 'を', part_of_speech: 'Particle', basic_form: 'を', meaning: 'Object marker' },
                    { surface: '勉強', reading: 'べんきょう', part_of_speech: 'Noun', basic_form: '勉強', meaning: 'Study' },
                    { surface: 'します', reading: 'します', part_of_speech: 'Verb', basic_form: 'する', meaning: 'To do' }
                ],
                meta: { grammar_hits: 2 },
                explanation: 'This sentence uses the object marker を to indicate that Japanese is what is being studied.',
                grammar: [
                    { name: 'を (Object Marker)', description: 'Indicates the direct object of a verb.', level: 'N5' },
                    { name: 'ます (Polite Form)', description: 'Polite verb ending.', level: 'N5' }
                ]
            };
            setResult(mockResult);
            if (!pinnedHistory.includes(inputText)) {
                setPinnedHistory(prev => [inputText, ...prev].slice(0, 5));
            }
        } catch (err) {
            setError('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTokenClick = (token: any) => {
        setSelectedToken(token);
        setViewMode('dictionary');
    };

    return (
        <div className="min-h-screen flex flex-col bg-transparent relative overflow-x-hidden">
            <SakuraHeader
                title="Deep Analysis"
                subtitle="SENTENCE ARCHIVE"
                subtitleColor="#7C3AED"
                actions={
                    <button
                        onClick={handleClear}
                        className="p-2.5 bg-white border border-sakura-divider rounded-xl text-sakura-cocoa/60 hover:text-sakura-ink transition-all"
                    >
                        <Eraser size={18} />
                    </button>
                }
            />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                {/* Left Side: Input & Tokens */}
                <div className="lg:col-span-7 flex flex-col h-full px-4 md:px-10 py-10 overflow-y-auto no-scrollbar">
                    <div className="max-w-5xl mx-auto w-full space-y-10 pb-20">
                        {/* Pinned History Bar */}
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                            <div className="px-3 py-1.5 bg-sakura-cocoa/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-sakura-cocoa/60 flex items-center gap-2">
                                <History size={12} />
                                Chronicle
                            </div>
                            {pinnedHistory.map((h, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setText(h); handleAnalyze(h); }}
                                    className="px-4 py-1.5 bg-white border border-sakura-divider rounded-full text-[10px] font-black whitespace-nowrap transition-all text-sakura-ink/80 hover:border-sakura-cocoa/40"
                                >
                                    {h.slice(0, 20)}{h.length > 20 ? '...' : ''}
                                </button>
                            ))}
                        </div>

                        {/* Input Area (Hard Glass) */}
                        <div className="relative group">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Input Japanese for deep synthesis..."
                                className="w-full h-40 md:h-52 p-8 md:p-10 text-xl font-black bg-white border border-sakura-divider rounded-[3rem] focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400 outline-none transition-all resize-none leading-relaxed text-sakura-ink placeholder:text-sakura-cocoa/40 group-hover:border-sakura-cocoa/30"
                            />

                            {/* Peeking Mascot Sticker */}
                            <div className="absolute -top-12 -right-6 w-24 h-24 pointer-events-none z-10">
                                <Image
                                    src="/hana_master_sticker.png"
                                    alt="Hana Master"
                                    width={96}
                                    height={96}
                                    className="object-contain -rotate-12"
                                />
                            </div>

                            <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                <button
                                    onClick={() => setExplainMode(!explainMode)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        explainMode
                                            ? "bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-200"
                                            : "bg-white text-sakura-cocoa/60 border-sakura-divider hover:bg-sakura-bg-soft"
                                    )}
                                >
                                    <Sparkles size={14} className={explainMode ? "animate-pulse" : ""} />
                                    AI Synapse
                                </button>
                                <button
                                    onClick={() => handleAnalyze()}
                                    disabled={loading || !text.trim()}
                                    className="flex items-center gap-2.5 px-8 py-2.5 bg-[#8B5CF6] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} className="text-white" />}
                                    Synthesize
                                </button>
                            </div>
                        </div>

                        {/* Bento Parser Grid */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-sakura-cocoa/40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Visual Parser Layer
                                </div>
                                {result && (
                                    <div className="px-3 py-1 bg-white border border-sakura-divider rounded-lg text-[9px] font-black text-sakura-cocoa/40">
                                        MATCHES: {result.meta.grammar_hits}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-[3rem] border border-sakura-divider p-8 md:p-14 min-h-[300px] flex items-center justify-center relative">
                                {loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 rounded-[3rem]">
                                        <Loader2 className="text-purple-600 animate-spin mb-4" size={40} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-sakura-ink">Crunching Grammar...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-red-500 font-black uppercase tracking-widest text-[11px] flex flex-col items-center gap-4 bg-red-50 p-10 rounded-[2rem] border border-red-100">
                                        <Info size={32} />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {!result && !loading && !error && (
                                    <div className="text-center space-y-6">
                                        <div className="w-20 h-20 bg-sakura-cocoa/5 rounded-[2rem] flex items-center justify-center mx-auto">
                                            <Book size={40} className="text-sakura-cocoa/20" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sakura-cocoa/30">Awaiting Substrate</p>
                                    </div>
                                )}

                                {result && (
                                    <div className="w-full text-3xl md:text-5xl lg:text-6xl leading-[2.2] flex flex-wrap gap-x-2 gap-y-6 justify-center transition-all animate-in fade-in duration-700">
                                        {result.tokens.map((token: any, idx: number) => (
                                            <TokenRenderer
                                                key={idx}
                                                token={token}
                                                isSelected={selectedToken === token}
                                                onClick={handleTokenClick}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Perspective Sidebar */}
                <div
                    className="lg:col-span-5 flex flex-col h-full bg-white border-l border-sakura-divider transition-colors duration-500"
                    style={{
                        borderColor: selectedToken ? '#7C3AED' : 'var(--color-sakura-divider)'
                    }}
                >
                    {/* Mode Selection */}
                    <div className="p-8 border-b border-sakura-divider bg-white">
                        <div className="flex p-1.5 bg-white border border-sakura-divider rounded-2xl">
                            <TabBtn active={viewMode === 'dictionary'} onClick={() => setViewMode('dictionary')} label="Glossary" icon={Book} />
                            <TabBtn active={viewMode === 'grammar'} onClick={() => setViewMode('grammar')} label="Insight" icon={Languages} count={result?.meta.grammar_hits} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                        {/* AI Intelligence Block */}
                        {result?.explanation && (
                            <div className="p-8 md:p-10 bg-purple-500/5 border-b border-purple-500/10">
                                <div className="flex items-center gap-3 mb-6 text-purple-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Sparkles size={16} /> Synthesis Insight
                                </div>
                                <div className="p-8 bg-white rounded-[2rem] border border-purple-100">
                                    <p className="text-[13px] text-sakura-ink leading-relaxed font-bold">
                                        {result.explanation}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="p-8 md:p-12">
                            {viewMode === 'dictionary' ? (
                                <div className="animate-in slide-in-from-right-10 duration-500">
                                    <DictionaryPanel token={selectedToken} />
                                </div>
                            ) : (
                                <div className="animate-in slide-in-from-right-10 duration-500">
                                    <GrammarPanel matches={result?.grammar || []} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Stats */}
                    {result && (
                        <div className="px-10 py-5 bg-white border-t border-sakura-divider flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/30">
                            <div className="flex gap-8">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sakura-cocoa/20" />
                                    Substrate: {result.tokens.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Patterns: {result.meta.grammar_hits}
                                </div>
                            </div>
                            <div className="text-purple-600 flex items-center gap-2">
                                <Monitor size={12} />
                                Full Sync
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ title, icon: Icon }: { title: string, icon: any }) {
    return (
        <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-sakura-cocoa/40">
            <Icon size={14} />
            {title}
        </div>
    );
}

function TabBtn({ active, onClick, label, icon: Icon, count }: { active: boolean, onClick: () => void, label: string, icon: any, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                active
                    ? "bg-[#6D28D9] text-white"
                    : "text-sakura-cocoa/60 hover:bg-sakura-cocoa/10"
            )}
        >
            <Icon size={16} className={active ? "text-purple-400" : ""} />
            {label}
            {count !== undefined && count > 0 && (
                <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-md text-[8px]",
                    active ? "bg-white/10 text-white" : "bg-sakura-divider/40 text-sakura-cocoa/40"
                )}>{count}</span>
            )}
        </button>
    );
}
