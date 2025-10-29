'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Layers, Award, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatJapanese, formatMnemonic } from '@/lib/japanese';
import { ContentCard } from '@/lib/ContentCard';
import { SRSStatusBadge } from '@/lib/SRSStatusBadge';
import { LEARNING_STATES, CONTENT_TYPES, type LearningStatus } from '@/config/design.config';


interface RadicalDetailViewProps {
    radical: any;
    linkedKanji: any[];
    srsInfo: { state: string, next_review: string } | null;
}

export function RadicalDetailView({
    radical,
    linkedKanji,
    srsInfo
}: RadicalDetailViewProps) {
    const currentState = (srsInfo?.state?.toLowerCase() || 'new') as LearningStatus;
    const contentDesign = CONTENT_TYPES.radical;

    return (
        <div className="min-h-screen bg-sakura-bg-app">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                <Link
                    href="/radicals"
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
                                >Radical</span>
                                <span className="px-3 py-1 bg-sakura-bg-soft text-sakura-text-muted text-[10px] font-black uppercase tracking-widest rounded-lg border border-sakura-divider">Level {radical.level}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-sakura-text-primary tracking-tighter uppercase mb-2">{radical.name}</h1>
                            <p className="text-sm font-bold text-sakura-text-muted uppercase tracking-[0.15em]">Designation: <span className="text-sakura-text-primary">{radical.meaning}</span></p>
                        </div>

                        {radical.mnemonic && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8 md:p-10">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${contentDesign.inkColor}15` }}>
                                        <Sparkles size={14} style={{ color: contentDesign.inkColor }} />
                                    </div>
                                    Cognitive Pathway
                                </h2>
                                <div className="text-sakura-text-secondary leading-relaxed font-bold text-base md:text-lg" dangerouslySetInnerHTML={{ __html: formatMnemonic(radical.mnemonic) }} />

                            </section>
                        )}

                        {linkedKanji.length > 0 && (
                            <section className="bg-white rounded-[2.5rem] border border-sakura-divider p-8 md:p-10">
                                <h2 className="text-[10px] font-black text-sakura-text-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${CONTENT_TYPES.kanji.inkColor}15` }}>
                                        <Layers size={14} style={{ color: CONTENT_TYPES.kanji.inkColor }} />
                                    </div>
                                    Found In Kanji Architecture
                                </h2>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {linkedKanji.map((k, i) => (
                                        <ContentCard key={i} type="KANJI" character={k.character} meaning={k.meanings.primary[0]} href={`/kanji/${encodeURIComponent(k.character)}`} srsState={k.srs_state} />
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
                                    className="text-[10rem] font-jp font-black select-none"
                                    style={{ color: (currentState === 'learning' || currentState === 'review') ? 'white' : currentState === 'mastered' || currentState === 'burned' ? '#475569' : contentDesign.inkColor }}
                                >
                                    {radical.character || <Award size={80} className="opacity-20 translate-y-2" />}
                                </span>
                                <div className="absolute top-4 right-4"><SRSStatusBadge state={currentState} contentType="radical" className="scale-150" /></div>
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
                                        <SRSStatusBadge state={currentState} contentType="radical" className="static" />
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
                            <div className="space-y-3">
                                <a href={`https://www.wanikani.com/radicals/${encodeURIComponent(radical.slug || radical.name || '')}`} target="_blank" className="flex items-center justify-between p-4 bg-sakura-bg-soft hover:bg-sakura-bg-muted rounded-2xl transition-all border border-transparent hover:border-sakura-divider"><span className="text-xs font-black uppercase tracking-widest text-sakura-text-primary">WaniKani</span><ExternalLink size={14} className="text-sakura-text-muted group-hover:text-sakura-text-primary" /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
