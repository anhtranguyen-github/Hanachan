import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, PlayCircle, Download, BookOpen, Layers, Zap, Sparkles, Target, Info, Hash } from 'lucide-react';
import { clsx } from 'clsx';

export default async function KanjiDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const kanji: any = await getLocalKU('kanji', slug);

    if (!kanji) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-lg">
            <div className="mn-card p-2xl text-center max-w-md border border-border bg-surface">
                <Info size={32} className="text-primary-dark mx-auto mb-md" />
                <h2 className="text-h2 font-black uppercase mb-sm text-foreground tracking-tight">Kanji Not Found</h2>
                <p className="text-body text-foreground/40 mb-xl">The data signature for this kanji could not be retrieved.</p>
                <Link href="/content?type=kanji" className="mn-btn mn-btn-primary w-full">BACK TO ARCHIVES</Link>
            </div>
        </div>
    );

    const kuKanji = kanji.ku_kanji || {};
    const meanings = kanji.meanings || [kanji.meaning];

    return (
        <div className="max-w-[1400px] mx-auto py-xl px-lg space-y-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <Link href="/content?type=kanji" className="flex items-center gap-sm text-foreground/30 hover:text-foreground transition-all group px-lg py-md bg-surface-muted/30 border border-border/50 rounded-2xl">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-metadata font-black uppercase tracking-[0.2em]">KANJI ARCHIVES</span>
                </Link>
                <div />
            </div>

            {/* Spectacular Hero Header - Normalized */}
            <header className="relative flex flex-col lg:flex-row items-center gap-xl p-xl bg-surface border border-border rounded-clay shadow-2xl shadow-primary/5 group overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />

                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 rounded-full" />
                    <div className="relative w-64 h-64 lg:w-kanji-hero lg:h-kanji-hero max-w-[450px] aspect-square bg-surface border-b-[8px] border-primary/10 rounded-clay flex items-center justify-center shadow-lg border border-border group-hover:scale-[1.01] transition-transform duration-700 overflow-hidden text-center px-lg">
                        <span className="text-[100px] lg:text-[140px] font-black text-foreground jp-text leading-none">{kanji.character}</span>
                        <div className="absolute top-8 left-8 bg-foreground text-surface px-6 py-2 rounded-2xl text-metadata font-black uppercase tracking-widest shadow-lg">
                            L{kanji.level}
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-lg text-center lg:text-left z-10 w-full overflow-hidden">
                    <div className="space-y-sm overflow-hidden">
                        <div className="flex items-center gap-sm justify-center lg:justify-start">
                            <Target size={14} className="text-primary-dark" />
                            <span className="text-metadata font-black text-primary-dark uppercase tracking-[0.4em]">Primary Concept</span>
                        </div>
                        <h1 className="text-h1 font-black text-foreground tracking-tightest leading-tight uppercase truncate">
                            {meanings[0]}
                        </h1>
                        <div className="flex flex-wrap gap-sm justify-center lg:justify-start">
                            {meanings.slice(1).map((m: string, i: number) => (
                                <span key={i} className="text-h3 font-black text-foreground/10 uppercase tracking-tighter italic truncate max-w-[200px]">{m}</span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-sm justify-center lg:justify-start">
                        <div className="px-lg py-sm bg-surface-muted border border-border rounded-xl flex items-center gap-sm h-12">
                            <Zap size={12} className="text-primary-dark" />
                            <span className="text-metadata font-black uppercase tracking-widest">N{kanji.jlpt || '?'} Visual Archetype</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Strategic Information Architecture */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-xl">

                {/* Left: Readings & Mnemonics */}
                <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-xl">
                    {/* Specialized Reading Matrix */}
                    <div className="p-xl bg-primary/5 border border-primary/10 rounded-clay relative overflow-hidden group/read">
                        <div className="absolute top-0 right-0 p-lg">
                            <Hash size={48} className="text-primary-dark/5" />
                        </div>
                        <div className="space-y-lg relative z-10 h-full flex flex-col justify-between">
                            <div className="flex items-center gap-sm">
                                <div className="p-sm bg-primary/20 rounded-xl">
                                    <PlayCircle size={18} className="text-primary-dark" />
                                </div>
                                <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Phonetic Profile</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-xl pt-lg">
                                <div className="space-y-sm">
                                    <div className="text-metadata font-black text-primary-dark uppercase tracking-widest border-b border-primary/10 pb-1">ONYOMI</div>
                                    <div className="text-h2 font-black text-foreground jp-text tracking-tighter">{kuKanji.reading_onyomi || '—'}</div>
                                    <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest italic">Acoustic Signal</div>
                                </div>
                                <div className="space-y-sm">
                                    <div className="text-metadata font-black text-foreground/40 uppercase tracking-widest border-b border-border/50 pb-1">KUNYOMI</div>
                                    <div className="text-h2 font-black text-foreground jp-text tracking-tighter">{kuKanji.reading_kunyomi || '—'}</div>
                                    <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest italic">Conceptual Signal</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Narrative Strategy */}
                    <div className="p-xl bg-surface border border-border rounded-clay relative overflow-hidden group/strategy">
                        <div className="absolute top-0 right-0 p-lg">
                            <Sparkles size={48} className="text-foreground/5" />
                        </div>
                        <div className="space-y-lg relative z-10 overflow-hidden">
                            <div className="flex items-center gap-sm">
                                <div className="p-sm bg-surface-muted rounded-xl">
                                    <BookOpen size={18} className="text-foreground/40" />
                                </div>
                                <h2 className="text-h3 font-black text-foreground/40 uppercase tracking-[0.4em]">Anchor Strategy</h2>
                            </div>
                            <div className="text-body font-medium text-foreground/80 leading-relaxed indent-lg line-clamp-[6] overflow-hidden first-letter:text-6xl first-letter:font-black first-letter:text-primary-dark first-letter:float-left first-letter:mr-4">
                                <RichTextRenderer content={kuKanji.meaning_explanation || kanji.mnemonics?.meaning || "A strategic memory anchor for this kanji has not yet been indexed."} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Width Sections */}
                <div className="xl:col-span-12 space-y-xl">
                    {/* Composition Hierarchy */}
                    <section className="p-xl bg-surface border border-border rounded-clay shadow-xl group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-xl border-b border-border/50 pb-lg mb-xl">
                            <div className="flex items-center gap-sm">
                                <div className="p-sm bg-primary/5 rounded-2xl">
                                    <Layers size={18} className="text-primary-dark" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Composition Nodes</h2>
                                    <p className="text-metadata font-bold text-foreground/20 uppercase tracking-widest italic">Integrated building blocks</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-lg">
                            {(kanji.radicals || []).map((r: any, i: number) => (
                                <Link key={i} href={`/content/radicals/${r.slug}`} className="flex flex-col items-center justify-center gap-sm p-lg rounded-[2.5rem] bg-surface-muted/30 border border-border hover:border-primary/20 hover:scale-[1.02] transition-all group/node h-[120px]">
                                    <span className="text-4xl font-black text-foreground group-hover/node:text-primary-dark transition-colors jp-text">{r.character}</span>
                                    <span className="text-metadata font-black text-foreground/20 uppercase tracking-widest text-center truncate w-full px-2">{r.meaning}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Contextual Network - Normalized grid and items */}
                    <section className="space-y-lg">
                        <div className="flex items-center justify-between px-lg pb-lg border-b-2 border-border/50">
                            <div className="flex items-center gap-sm">
                                <div className="p-sm bg-surface-muted rounded-xl">
                                    <Target size={18} className="text-foreground/30" />
                                </div>
                                <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.6em]">Integrated Vocabulary</h2>
                            </div>
                            <div />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
                            {kanji.vocabulary?.map((v: any, i: number) => (
                                <Link key={i} href={`/content/vocabulary/${v.slug}`} className="group relative p-lg bg-surface border border-border rounded-clay hover:border-primary/30 transition-all duration-500 overflow-hidden h-vocab-card flex flex-col justify-between shadow-sm hover:shadow-xl">
                                    <div className="flex items-start justify-between gap-xl">
                                        <div className="text-4xl font-black text-foreground group-hover:text-primary-dark transition-colors jp-text truncate flex-1">{v.character}</div>
                                        <div className="w-1.5 h-1.5 bg-primary/10 rounded-full group-hover:bg-primary transition-colors shrink-0" />
                                    </div>
                                    <div className="space-y-sm">
                                        <div className="text-metadata font-black text-foreground/60 uppercase tracking-tight line-clamp-1 italic">{v.reading || v.reading_primary}</div>
                                        <div className="text-card-title font-black text-foreground/40 uppercase tracking-tight line-clamp-1 truncate">{v.meaning}</div>
                                    </div>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 p-lg rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                        <ChevronLeft size={18} className="text-primary-dark rotate-180" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
