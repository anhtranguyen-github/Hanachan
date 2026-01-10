'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, Layers, Volume2, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatJapanese, formatMnemonic } from '@/lib/japanese';
import { ContentCard } from '@/ui/components/shared/ContentCard';
import { SRSStatusBadge } from '@/ui/components/shared/SRSStatusBadge';
import { LEARNING_STATES, CONTENT_TYPES, type LearningStatus } from '@/config/design.config';


interface KanjiDetailViewProps {
    kanji: any;
    linkedVocab: any[];
    linkedRadicals: any[];
    srsInfo: { state: string, next_review: string } | null;
}

export function KanjiDetailView({
    kanji,
    linkedVocab,
    linkedRadicals,
    srsInfo
}: KanjiDetailViewProps) {
    const currentState = (srsInfo?.state?.toLowerCase() || 'new') as LearningStatus;
    const contentDesign = CONTENT_TYPES.kanji;

    return (
        <div className="min-h-screen bg-sakura-bg-app">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                <Link
                    href="/kanji"
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
                                >Kanji</span>
                                <span className="px-3 py-1 bg-sakura-bg-soft text-sakura-text-muted text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">Level {kanji.level}</span>
                                {kanji.jlpt && (
                                    <span className="px-3 py-1 bg-sakura-bg-muted text-sakura-text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">JLPT {kanji.jlpt?.toUpperCase()}</span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-sakura-text-primary tracking-tighter uppercase mb-2">
                                {kanji.meanings.primary.join(', ')}
                            </h1>
                            {kanji.meanings.alternatives?.length > 0 && (
                                <p className="text-sm font-bold text-sakura-text-muted uppercase tracking-[0.15em]">
                                    Secondary: <span className="text-sakura-text-primary">{kanji.meanings.alternatives.join(', ')}</span>
                                </p>
                            )}
                        </div>

                        {linkedRadicals.length > 0 && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${CONTENT_TYPES.radical.inkColor}15` }}>
                                        <Layers size={14} style={{ color: CONTENT_TYPES.radical.inkColor }} />
                                    </div>
                                    Structural Components
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {linkedRadicals.map((r, i) => (
                                        <ContentCard key={i} type="RADICAL" character={r.character || r.name} meaning={r.name} href={`/radicals/${encodeURIComponent(r.slug || r.name)}`} srsState={r.srs_state} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                            <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <div className="p-2 rounded-xl" style={{ backgroundColor: `${contentDesign.inkColor}15` }}>
                                    <Book size={14} style={{ color: contentDesign.inkColor }} />
                                </div>
                                Conceptual Essence
                            </h2>
                            <div className="space-y-6">
                                <div className="p-6 bg-sakura-bg-soft rounded-3xl">
                                    <p className="text-lg font-black text-sakura-text-primary">{kanji.meanings.primary.join(', ')}</p>
                                </div>
                                {kanji.meanings.mnemonic && (
                                    <div className="p-6 border border-kanji/10 bg-kanji/5 rounded-3xl">
                                        <p className="text-[10px] font-black text-kanji/60 uppercase tracking-[0.3em] mb-4">Cognitive Pathway</p>
                                        <div className="text-sakura-text-secondary leading-relaxed font-bold text-base" dangerouslySetInnerHTML={{ __html: formatMnemonic(kanji.meanings.mnemonic) }} />

                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                            <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                <div className="p-2 rounded-xl" style={{ backgroundColor: `${contentDesign.inkColor}15` }}>
                                    <Volume2 size={14} style={{ color: contentDesign.inkColor }} />
                                </div>
                                Phonetic Spectrum
                            </h2>
                            <div className="space-y-8">
                                {kanji.readings.onyomi?.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-4">On&apos;yomi (Sino-Japanese)</p>
                                        <div className="flex flex-wrap gap-3">
                                            {kanji.readings.onyomi.map((r: string, i: number) => (
                                                <span key={i} className="px-6 py-3 font-jp text-xl font-black rounded-2xl border transition-all" style={i === 0 ? { backgroundColor: contentDesign.inkColor, color: 'white', borderColor: contentDesign.inkColor } : { backgroundColor: `${contentDesign.inkColor}15`, color: contentDesign.inkColor, borderColor: `${contentDesign.inkColor}20` }}>{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {kanji.readings.kunyomi?.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-4">Kun&apos;yomi (Native Japanese)</p>
                                        <div className="flex flex-wrap gap-3">
                                            {kanji.readings.kunyomi.map((r: string, i: number) => (
                                                <span key={i} className="px-6 py-3 font-jp text-xl font-black bg-sakura-bg-soft text-sakura-text-primary border border-sakura-divider rounded-2xl">{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {linkedVocab.length > 0 && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${CONTENT_TYPES.vocabulary.inkColor}15` }}>
                                        <Sparkles size={14} style={{ color: CONTENT_TYPES.vocabulary.inkColor }} />
                                    </div>
                                    Lexical Manifestations
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {linkedVocab.map((v, i) => (
                                        <ContentCard key={i} type="VOCABULARY" character={v.character} reading={v.readings?.primary} meaning={v.meanings?.primary?.[0] || ''} href={`/vocabulary/${encodeURIComponent(v.character || v.slug || '')}`} srsState={v.srs_state} />
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
                                    className="text-[10rem] font-jp font-black select-none"
                                    style={{ color: (currentState === 'learning' || currentState === 'review') ? 'white' : currentState === 'mastered' || currentState === 'burned' ? '#475569' : contentDesign.inkColor }}
                                >
                                    {kanji.character}
                                </span>
                                <div className="absolute top-4 right-4"><SRSStatusBadge state={currentState} contentType="kanji" className="scale-150" /></div>
                            </div>
                            <div
                                className="mb-6 rounded-3xl border p-6 text-left space-y-4"
                                style={{
                                    backgroundColor: (currentState === 'mastered' || currentState === 'burned') ? '#f8fafc' : `${contentDesign.inkColor}05`,
                                    borderColor: (currentState === 'mastered' || currentState === 'burned') ? '#e2e8f0' : `${contentDesign.inkColor}20`
                                }}
                            >
                                <div>
                                    <div className="text-[10px] font-black uppercase text-sakura-text-muted tracking-widest mb-1">Learning Status</div>
                                    <div className="flex items-center gap-2">
                                        <SRSStatusBadge state={currentState} contentType="kanji" className="static" />
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
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`https://jisho.org/search/${kanji.character}%20%23kanji`} target="_blank" className="flex items-center justify-center p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider text-[10px] font-black uppercase tracking-widest text-sakura-text-primary gap-2">Jisho <ExternalLink size={12} /></a>
                                <a href={`https://www.wanikani.com/kanji/${kanji.character}`} target="_blank" className="flex items-center justify-center p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider text-[10px] font-black uppercase tracking-widest text-sakura-text-primary gap-2">WK <ExternalLink size={12} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
