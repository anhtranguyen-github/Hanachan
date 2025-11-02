'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Play, Volume2, Book, Layers, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/ui/components/shared/ContentCard';
import { SRSStatusBadge } from '@/ui/components/shared/SRSStatusBadge';
import { LEARNING_STATES, CONTENT_TYPES, type LearningStatus } from '@/config/design.config';
import { formatJapanese, formatMnemonic } from '@/lib/japanese';


interface VocabularyDetailViewProps {
    vocab: any;
    linkedKanji: any[];
    srsInfo: { state: string, next_review: string } | null;
}

export function VocabularyDetailView({
    vocab,
    linkedKanji,
    srsInfo
}: VocabularyDetailViewProps) {
    const currentState = (srsInfo?.state?.toLowerCase() || 'new') as LearningStatus;
    const contentDesign = CONTENT_TYPES.vocabulary;

    const playAudio = (url: string) => {
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Audio playback failed", e));
    };

    return (
        <div className="min-h-screen bg-sakura-bg-app">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                <Link
                    href="/vocabulary"
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
                                >Vocabulary</span>
                                <span className="px-3 py-1 bg-sakura-bg-soft text-sakura-text-muted text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">Level {vocab.level}</span>
                                {vocab.jlpt && (
                                    <span className="px-3 py-1 bg-sakura-bg-muted text-sakura-text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">JLPT {vocab.jlpt?.toUpperCase()}</span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-sakura-text-primary tracking-tighter uppercase mb-4 leading-tight">
                                {vocab.meanings.primary.join(', ')}
                            </h1>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {vocab.meanings.word_types?.map((pos: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-sakura-bg-soft text-sakura-text-muted text-[10px] font-bold uppercase tracking-widest rounded-lg border border-sakura-divider">{pos}</span>
                                ))}
                            </div>
                        </div>

                        {linkedKanji.length > 0 && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-kanji/10 rounded-xl"><Layers size={14} className="text-kanji" /></div>
                                    Structural components
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {linkedKanji.map((k, i) => (
                                        <ContentCard key={i} type="KANJI" character={k.character} meaning={k.meanings.primary[0]} href={`/kanji/${encodeURIComponent(k.character)}`} srsState={k.srs_state} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                            <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <div className="p-2 bg-vocab/10 rounded-xl"><Book size={14} className="text-vocab" /></div>
                                Conceptual Essence
                            </h2>
                            <div className="space-y-6">
                                <div className="p-6 bg-sakura-bg-soft rounded-3xl">
                                    <p className="text-lg font-black text-sakura-text-primary">{vocab.meanings.primary.join(', ')}</p>
                                </div>
                                {vocab.meanings.explanation && (
                                    <div className="p-6 border border-vocab/10 bg-vocab/5 rounded-3xl">
                                        <p className="text-[10px] font-black text-vocab/60 uppercase tracking-[0.3em] mb-4">Semantic Analysis</p>
                                        <div className="text-sakura-text-secondary leading-relaxed font-bold text-base" dangerouslySetInnerHTML={{ __html: formatMnemonic(vocab.meanings.explanation) }} />

                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                            <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <div className="p-2 bg-sakura-accent-primary/10 rounded-xl"><Volume2 size={14} className="text-sakura-accent-primary" /></div>
                                Phonetic Spectrum
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-6 p-6 bg-sakura-bg-soft rounded-3xl">
                                    <span className="text-3xl font-jp font-black text-vocab">{vocab.readings.primary}</span>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {vocab.readings.audio?.map((a: any, i: number) => (
                                            <button key={i} onClick={() => playAudio(a.url)} className="p-3 bg-white hover:bg-vocab/10 text-vocab rounded-2xl transition-all border border-sakura-divider"><Play size={18} fill="currentColor" /></button>
                                        ))}
                                    </div>
                                </div>
                                {vocab.readings.explanation && (
                                    <div className="p-6 bg-sakura-bg-soft/50 rounded-3xl border border-sakura-divider">
                                        <p className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-4">Phonetic Anchor</p>
                                        <div className="text-sakura-text-secondary leading-relaxed font-bold text-base" dangerouslySetInnerHTML={{ __html: formatMnemonic(vocab.readings.explanation) }} />

                                    </div>
                                )}
                            </div>
                        </section>

                        {vocab.context_sentences?.length > 0 && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-vocab/10 rounded-xl"><MessageSquare size={14} className="text-vocab" /></div>
                                    Usage Manifestations
                                </h2>
                                <div className="space-y-4">
                                    {vocab.context_sentences.map((s: any, i: number) => (
                                        <div key={i} className="p-6 bg-sakura-bg-soft rounded-3xl border border-transparent hover:border-sakura-divider transition-all">
                                            <p
                                                className="text-xl font-jp font-black text-sakura-text-primary mb-2"
                                                dangerouslySetInnerHTML={{ __html: formatJapanese(s.ja || s.sentence_text || '') }}
                                            />
                                            <p className="text-sm font-bold text-sakura-text-muted">{s.en || s.translation || ''}</p>
                                        </div>
                                    ))}

                                </div>
                            </section>
                        )}
                    </div>

                    <div className="lg:col-span-5 space-y-8 sticky top-8">
                        <div className="bg-white rounded-[3rem] border border-sakura-divider p-10 text-center relative overflow-hidden group">
                            <div
                                className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-3xl transition-all"
                                style={{ backgroundColor: `${contentDesign.inkColor}08` }}
                            />
                            <div
                                className="relative inline-flex items-center justify-center w-full min-h-[12rem] py-8 px-4 rounded-[3rem] mb-8 transition-transform group-hover:scale-105 duration-500 border-2"
                                style={{
                                    backgroundColor: (currentState === 'learning' || currentState === 'review') ? contentDesign.inkColor : currentState === 'mastered' || currentState === 'burned' ? '#f1f5f9' : contentDesign.pastelBg,
                                    borderColor: currentState === 'mastered' || currentState === 'burned' ? '#cbd5e1' : contentDesign.inkColor
                                }}
                            >
                                <span
                                    className="text-6xl md:text-7xl font-jp font-black select-none"
                                    style={{ color: (currentState === 'learning' || currentState === 'review') ? 'white' : currentState === 'mastered' || currentState === 'burned' ? '#475569' : contentDesign.inkColor }}
                                >
                                    {vocab.character}
                                </span>
                                <div className="absolute top-4 right-4"><SRSStatusBadge state={currentState} contentType="vocabulary" className="scale-150" /></div>
                            </div>
                            <div
                                className="mb-6 p-6 rounded-3xl border text-left space-y-4"
                                style={{
                                    backgroundColor: (currentState === 'mastered' || currentState === 'burned') ? '#f8fafc' : `${contentDesign.inkColor}05`,
                                    borderColor: (currentState === 'mastered' || currentState === 'burned') ? '#e2e8f0' : `${contentDesign.inkColor}20`
                                }}
                            >
                                <div>
                                    <div className="text-[10px] font-black uppercase text-sakura-text-muted tracking-widest mb-1">Learning Status</div>
                                    <div className="flex items-center gap-2">
                                        <SRSStatusBadge state={currentState} contentType="vocabulary" className="static" />
                                        <span
                                            className="text-sm font-black uppercase"
                                            style={{ color: (currentState === 'burned') ? '#64748b' : contentDesign.inkColor }}
                                        >
                                            {currentState}
                                        </span>
                                    </div>
                                </div>
                                {srsInfo?.next_review && (
                                    <div className="pt-4 border-t border-gray-200/50">
                                        <div className="text-[10px] font-black uppercase text-sakura-text-muted tracking-widest mb-1">Next Review</div>
                                        <div className="text-sm font-bold text-sakura-text-primary">{new Date(srsInfo.next_review).toLocaleString()}</div>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <a href={`https://jisho.org/search/${encodeURIComponent(vocab.character)}`} target="_blank" className="flex items-center justify-center p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider text-[10px] font-black uppercase tracking-widest text-sakura-text-primary gap-2">Jisho <ExternalLink size={12} /></a>
                                <a href={`https://www.wanikani.com/vocabulary/${encodeURIComponent(vocab.character)}`} target="_blank" className="flex items-center justify-center p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider text-[10px] font-black uppercase tracking-widest text-sakura-text-primary gap-2">WK <ExternalLink size={12} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
