'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, Layers, MessageSquare, Sparkles, ExternalLink, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SRSStatusBadge } from '@/ui/components/shared/SRSStatusBadge';
import { LEARNING_STATES, CONTENT_TYPES, type LearningStatus } from '@/config/design.config';
import { formatJapanese } from '@/lib/japanese';


interface GrammarDetailViewProps {
    grammar: any;
    srsInfo: { state: string, next_review: string | null } | null;
    deckName: string | null;
    deckId?: string | null;
}

export function GrammarDetailView({
    grammar,
    srsInfo,
    deckName,
    deckId
}: GrammarDetailViewProps) {
    const currentState = (srsInfo?.state?.toLowerCase() || 'locked') as LearningStatus;
    const stateDesign = LEARNING_STATES[currentState];
    const contentDesign = CONTENT_TYPES.grammar;

    const playAudio = (url: string) => {
        new Audio(url).play().catch(e => console.error("Audio playback failed", e));
    };

    return (
        <div className="min-h-screen bg-sakura-bg-app">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                <Link
                    href="/grammar"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-sakura-bg-soft text-sakura-text-muted hover:text-sakura-accent-primary rounded-xl border border-sakura-divider transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                >
                    <ArrowLeft size={14} />
                    Back to Library
                </Link>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span
                                    className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border"
                                    style={{
                                        backgroundColor: `${contentDesign.inkColor}15`,
                                        color: contentDesign.inkColor,
                                        borderColor: `${contentDesign.inkColor}30`
                                    }}
                                >Grammar</span>
                                {grammar.level && <span className="px-3 py-1 bg-sakura-bg-soft text-sakura-text-muted text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">Level {grammar.level}</span>}
                                {grammar.jlpt && <span className="px-3 py-1 bg-sakura-bg-muted text-sakura-text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">JLPT {grammar.jlpt?.toUpperCase()}</span>}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-sakura-text-primary tracking-tighter uppercase mb-2 leading-tight">{grammar.title}</h1>
                            {grammar.meanings?.[0] && <p className="text-sm font-bold text-sakura-text-muted uppercase tracking-[0.15em]">Semantic Core: <span className="text-sakura-text-primary">{grammar.meanings[0]}</span></p>}
                        </div>

                        {(grammar.structure?.patterns_html || grammar.structure?.patterns) && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${contentDesign.inkColor}15` }}>
                                        <Layers size={14} style={{ color: contentDesign.inkColor }} />
                                    </div>
                                    Syntactic Architecture
                                </h2>
                                <div className="p-6 bg-sakura-bg-soft rounded-3xl border border-sakura-divider">
                                    <div
                                        className="text-xl font-jp font-black text-sakura-text-primary leading-relaxed whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{
                                            __html: grammar.structure.patterns_html || (Array.isArray(grammar.structure.patterns) ? grammar.structure.patterns.join('\n') : grammar.structure.patterns)
                                        }}
                                    />
                                </div>
                            </section>
                        )}

                        {grammar.about?.text && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${contentDesign.inkColor}15` }}>
                                        <Book size={14} style={{ color: contentDesign.inkColor }} />
                                    </div>
                                    Structural Nuances
                                </h2>
                                <div className="text-sakura-text-secondary leading-relaxed text-base whitespace-pre-wrap">
                                    {grammar.about.text}
                                </div>
                            </section>
                        )}


                        {grammar.examples?.length > 0 && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${contentDesign.inkColor}15` }}>
                                        <MessageSquare size={14} style={{ color: contentDesign.inkColor }} />
                                    </div>
                                    Usage Manifestations
                                </h2>
                                <div className="space-y-4">
                                    {grammar.examples.map((ex: any, i: number) => (
                                        <div key={i} className="p-6 bg-sakura-bg-soft rounded-3xl border border-transparent hover:border-sakura-divider transition-all">
                                            <div className="flex items-start justify-between gap-6">
                                                <div
                                                    className="text-xl font-jp font-black flex-1 leading-relaxed text-sakura-text-primary"
                                                    dangerouslySetInnerHTML={{
                                                        __html: formatJapanese(ex.sentence_text || ex.jp || '')
                                                    }}
                                                />

                                                {(ex.audio || ex.audio_url) && <button onClick={() => playAudio(ex.audio || ex.audio_url)} className="p-3 bg-white hover:bg-sakura-bg-muted rounded-full text-sakura-accent-primary transition-all border border-sakura-divider"><Play size={18} fill="currentColor" /></button>}
                                            </div>
                                            <p className="mt-2 text-sm font-bold text-sakura-text-muted">{ex.en || ex.translation || ''}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="lg:col-span-5 space-y-8 sticky top-8">
                        <div className="bg-white rounded-[3rem] border border-sakura-divider p-10 text-center relative overflow-hidden group">
                            <div
                                className="relative inline-flex items-center justify-center w-full min-h-[12rem] py-8 px-4 rounded-[3rem] mb-8 transition-transform group-hover:scale-105 duration-500 border-2"
                                style={{
                                    backgroundColor: (currentState === 'learning' || currentState === 'review') ? contentDesign.inkColor : currentState === 'mastered' || currentState === 'burned' ? '#f1f5f9' : contentDesign.pastelBg,
                                    borderColor: currentState === 'mastered' || currentState === 'burned' ? '#cbd5e1' : contentDesign.inkColor
                                }}
                            >
                                <span
                                    className="text-4xl md:text-5xl font-jp font-black select-none tracking-tighter"
                                    style={{ color: (currentState === 'learning' || currentState === 'review') ? 'white' : currentState === 'mastered' || currentState === 'burned' ? '#475569' : contentDesign.inkColor }}
                                    dangerouslySetInnerHTML={{ __html: grammar.title_with_furigana || grammar.title }}
                                />
                                <div className="absolute top-4 right-4"><SRSStatusBadge state={currentState} contentType="grammar" className="scale-150" /></div>
                            </div>
                            <div
                                className="mb-6 rounded-3xl border p-6 text-left space-y-4"
                                style={{
                                    backgroundColor: (currentState === 'mastered' || currentState === 'burned') ? '#f8fafc' : `${contentDesign.inkColor}05`,
                                    borderColor: (currentState === 'mastered' || currentState === 'burned') ? '#e2e8f0' : `${contentDesign.inkColor}20`
                                }}
                            >
                                <div>
                                    <div className="text-[10px] font-black uppercase text-sakura-text-muted tracking-widest mb-1 border-b border-sakura-divider pb-2">User Scope</div>
                                    <div className="space-y-3 pt-2">
                                        <div className="text-xs font-bold text-sakura-text-secondary">Learning Status</div>
                                        <div className="flex items-center gap-2">
                                            <SRSStatusBadge state={currentState} contentType="grammar" className="static" />
                                            <span
                                                className="text-xs font-black uppercase"
                                                style={{ color: (currentState === 'burned') ? '#64748b' : contentDesign.inkColor }}
                                            >
                                                {currentState}
                                            </span>
                                        </div>
                                        {srsInfo?.next_review && <div className="flex justify-between items-center"><span className="text-xs font-bold text-sakura-text-secondary">Next Review</span><span className="text-xs font-black uppercase text-sakura-text-primary">{new Date(srsInfo.next_review).toLocaleDateString()}</span></div>}
                                        {deckName && deckId && <div className="flex justify-between items-center pt-2 border-t border-sakura-divider/50"><span className="text-xs font-bold text-sakura-text-secondary">Found In Deck</span><Link href={`/decks/${deckId}`} className="text-xs font-black uppercase text-sakura-accent-primary underline">{deckName}</Link></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                            <h3 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-6 border-b border-sakura-divider pb-3">External Archives</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <a href={`https://bunpro.jp/grammar_points/${encodeURIComponent(grammar.slug)}`} target="_blank" className="flex items-center justify-center p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider text-[10px] font-black uppercase tracking-widest text-sakura-text-primary gap-2">Bunpro <ExternalLink size={12} /></a>
                                <a href={`https://jisho.org/search/${encodeURIComponent(grammar.title)}`} target="_blank" className="flex items-center justify-center p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider text-[10px] font-black uppercase tracking-widest text-sakura-text-primary gap-2">Jisho <ExternalLink size={12} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
