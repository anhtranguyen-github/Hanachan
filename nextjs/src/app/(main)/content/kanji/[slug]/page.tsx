/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, PlayCircle, BookOpen, Layers, Zap, Sparkles, Target, Info, Hash } from 'lucide-react';
import { KUInlineChat } from '@/features/chat/components/KUInlineChat';

export const dynamic = "force-dynamic";


export default async function KanjiDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const kanji: any = await getLocalKU('kanji', slug);

    if (!kanji) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="bg-white border border-border rounded-3xl p-8 text-center max-w-sm w-full shadow-sm">
                <Info size={28} className="text-primary mx-auto mb-4" />
                <h2 className="text-lg font-black uppercase mb-2 text-foreground">Kanji Not Found</h2>
                <p className="text-sm text-foreground/40 mb-6">This kanji could not be retrieved.</p>
                <Link href="/content?type=kanji" className="block w-full py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:opacity-90 transition-opacity">
                    Back to Kanji
                </Link>
            </div>
        </div>
    );

    const kuKanji = kanji.ku_kanji || {};
    const meanings = kanji.meanings || [kanji.meaning];
    const onReadings = kanji.onReadings || kuKanji.reading_onyomi?.split('、') || [];
    const kunReadings = kanji.kunReadings || kuKanji.reading_kunyomi?.split('、') || [];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
            {/* Breadcrumb */}
            <Link href="/content?type=kanji" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors group text-sm">
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Kanji</span>
            </Link>

            {/* Hero */}
            <header className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Character block */}
                    <div className="relative flex items-center justify-center bg-gradient-to-br from-[#F4ACB7]/10 to-[#F4ACB7]/5 border-b sm:border-b-0 sm:border-r border-border p-8 sm:p-10 shrink-0 sm:w-48 lg:w-56">
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-foreground text-white rounded-lg text-[9px] font-black uppercase tracking-widest">L{kanji.level}</span>
                        </div>
                        {kanji.jlpt && (
                            <div className="absolute top-3 right-3">
                                <span className="px-2 py-1 bg-primary/15 text-primary-dark rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/20">N{kanji.jlpt}</span>
                            </div>
                        )}
                        <span className="text-7xl sm:text-8xl font-black text-foreground jp-text leading-none select-none">
                            {kanji.character}
                        </span>
                    </div>

                    {/* Info block */}
                    <div className="flex-1 p-6 sm:p-8 space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">Primary Meaning</p>
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                                {meanings[0]}
                            </h1>
                            {meanings.length > 1 && (
                                <p className="text-sm text-foreground/30 font-bold mt-1 truncate">
                                    {meanings.slice(1).join(' · ')}
                                </p>
                            )}
                        </div>

                        {/* Readings */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
                            <div>
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1.5">On'yomi</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {onReadings.length > 0 ? onReadings.map((r: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-primary/8 border border-primary/15 rounded-xl text-sm font-black text-foreground jp-text">{r.trim()}</span>
                                    )) : <span className="text-sm text-foreground/20 font-bold">—</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mb-1.5">Kun'yomi</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {kunReadings.length > 0 ? kunReadings.map((r: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-surface-muted border border-border rounded-xl text-sm font-black text-foreground jp-text">{r.trim()}</span>
                                    )) : <span className="text-sm text-foreground/20 font-bold">—</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Mnemonic */}
                <div className="bg-white border border-border rounded-3xl p-6 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center">
                            <BookOpen size={14} className="text-primary-dark" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Meaning Mnemonic</h2>
                    </div>
                    <div className="text-sm text-foreground/70 leading-relaxed">
                        <RichTextRenderer content={kuKanji.meaning_explanation || kanji.mnemonics?.meaning || "No mnemonic available."} />
                    </div>
                </div>

                {/* Reading mnemonic */}
                <div className="bg-white border border-border rounded-3xl p-6 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-surface-muted rounded-xl flex items-center justify-center">
                            <PlayCircle size={14} className="text-foreground/40" />
                        </div>
                        <h2 className="text-sm font-black text-foreground/50 uppercase tracking-widest">Reading Mnemonic</h2>
                    </div>
                    <div className="text-sm text-foreground/60 leading-relaxed">
                        <RichTextRenderer content={kanji.mnemonics?.reading || kuKanji.reading_explanation || "No reading mnemonic available."} />
                    </div>
                </div>
            </div>

            {/* Radicals */}
            {(kanji.radicals || []).length > 0 && (
                <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Layers size={14} className="text-primary-dark" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Component Radicals</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
                        {(kanji.radicals || []).map((r: any, i: number) => (
                            <Link
                                key={i}
                                href={`/content/radicals/${r.slug}`}
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-surface-muted/40 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group aspect-square"
                            >
                                <span className="text-2xl font-black text-foreground group-hover:text-primary-dark transition-colors jp-text leading-none">{r.character}</span>
                                <span className="text-[8px] font-black text-foreground/30 uppercase tracking-wide text-center truncate w-full px-1">{r.meaning}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Vocabulary */}
            {(kanji.vocabulary || []).length > 0 && (
                <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-surface-muted rounded-xl flex items-center justify-center">
                            <Target size={14} className="text-foreground/40" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Related Vocabulary</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(kanji.vocabulary || []).map((v: any, i: number) => (
                            <Link
                                key={i}
                                href={`/content/vocabulary/${v.slug}`}
                                className="group flex items-center gap-3 p-4 bg-surface-muted/30 border border-border rounded-2xl hover:border-primary/30 hover:bg-primary/3 transition-all"
                            >
                                <span className="text-xl font-black text-foreground group-hover:text-primary-dark transition-colors jp-text shrink-0">{v.character}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-wide truncate">{v.reading || v.reading_primary}</p>
                                    <p className="text-xs font-bold text-foreground/60 truncate">{v.meaning}</p>
                                </div>
                                <ChevronLeft size={12} className="text-foreground/10 rotate-180 group-hover:text-primary shrink-0 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Chat Agent */}
            <KUInlineChat
                kuId={kanji.id}
                kuType="kanji"
                character={kanji.character || '?'}
                meaning={kanji.meaning}
                extraContext={`On'yomi: ${onReadings.join(', ') || 'none'}, Kun'yomi: ${kunReadings.join(', ') || 'none'}`}
            />
        </div>
    );
}
