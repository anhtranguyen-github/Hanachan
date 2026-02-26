import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, Zap, Target, Layers, Info, BookOpen, ExternalLink, Globe, Sparkles, Activity, Bookmark, Flame } from 'lucide-react';
import { clsx } from 'clsx';

export default async function GrammarDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const grammar: any = await getLocalKU('grammar', slug);

    if (!grammar) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-lg">
            <div className="mn-card p-2xl text-center max-w-md bg-surface border-border shadow-2xl">
                <Flame size={32} className="text-primary-dark mx-auto mb-md" />
                <h2 className="text-h2 font-black uppercase mb-sm text-foreground tracking-tight">Grammar Point Not Found</h2>
                <p className="text-body text-foreground/40 mb-xl font-medium">The structural formula for this grammar unit is missing from the linguistic archives.</p>
                <Link href="/content?type=grammar" className="mn-btn mn-btn-primary w-full">BACK TO ARCHIVES</Link>
            </div>
        </div>
    );

    const details = grammar.ku_grammar || {};
    const structure = grammar.structure || {};
    const resources = grammar.resources || { online: [], offline: [] };
    const related = grammar.related_grammar || [];

    return (
        <div className="max-w-[1400px] mx-auto py-xl px-lg space-y-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <Link href="/content?type=grammar" className="flex items-center gap-sm text-foreground/30 hover:text-foreground transition-all group px-lg py-md bg-surface-muted/30 border border-border/50 rounded-2xl">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-metadata font-black uppercase tracking-[0.2em]">GRAMMAR REPOSITORY</span>
                </Link>
                <div />
            </div>

            {/* Spectacular Hero Header - Normalized */}
            <header className="relative flex flex-col lg:flex-row items-center gap-xl p-xl bg-surface border border-border rounded-clay shadow-2xl shadow-primary/5 group overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />

                <div className="relative shrink-0 w-full lg:w-auto flex justify-center">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 rounded-full" />
                    <div className="relative w-64 h-64 lg:w-kanji-hero lg:h-kanji-hero max-w-[450px] aspect-square bg-surface border-b-[8px] border-primary/10 rounded-clay flex items-center justify-center shadow-lg border border-border group-hover:scale-[1.01] transition-transform duration-700 overflow-hidden text-center px-lg">
                        <span className="text-7xl lg:text-[100px] font-black text-foreground jp-text leading-none">{grammar.character}</span>
                        <div className="absolute top-8 left-8 flex flex-col gap-2">
                            <div className="bg-foreground text-surface px-4 py-1.5 rounded-xl text-metadata font-black uppercase tracking-widest shadow-lg">L{grammar.level}</div>
                            <div className="bg-primary/20 text-primary-dark px-4 py-1.5 rounded-xl text-metadata font-black uppercase tracking-widest border border-primary/10">JLPT N{grammar.jlpt || '?'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-lg text-center lg:text-left z-10 w-full overflow-hidden">
                    <div className="space-y-sm overflow-hidden">
                        <div className="flex items-center gap-sm justify-center lg:justify-start">
                            <Target size={14} className="text-primary-dark" />
                            <span className="text-metadata font-black text-primary-dark uppercase tracking-[0.4em]">UNIT SEMANTIC</span>
                        </div>
                        <h1 className="text-h1 font-black text-foreground tracking-tightest leading-tight uppercase truncate min-h-[1.2em]">
                            {grammar.meaning}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-sm justify-center lg:justify-start">
                        <div className="px-lg py-sm bg-surface-muted border border-border rounded-xl flex items-center gap-sm h-12">
                            <Activity size={12} className="text-primary-dark" />
                            <span className="text-metadata font-black uppercase tracking-widest">PHASE ARCHETYPE</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-xl">

                {/* Left: Explanation & Examples */}
                <div className="xl:col-span-8 space-y-xl">
                    <section className="relative p-xl bg-primary/5 border border-primary/10 rounded-clay space-y-lg overflow-hidden group/e">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40 group-hover/e:bg-primary transition-colors duration-700" />
                        <div className="flex items-center gap-sm">
                            <Zap size={18} className="text-primary-dark" strokeWidth={3} />
                            <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Intellectual Explanation</h2>
                        </div>
                        <div className="text-body font-medium text-foreground/80 leading-relaxed indent-lg overflow-hidden first-letter:text-6xl first-letter:font-black first-letter:text-primary-dark first-letter:float-left first-letter:mr-4 first-letter:mt-1">
                            <RichTextRenderer content={details.explanation || grammar.mnemonics?.meaning || "Linguistic simulation data not currently indexed."} />
                        </div>
                    </section>

                    <section className="space-y-xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-xl px-lg pb-xl border-b-2 border-border/50">
                            <div className="space-y-sm">
                                <div className="flex items-center gap-sm">
                                    <Globe size={18} className="text-foreground/30" />
                                    <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.6em]">Linguistic Simulations</h2>
                                </div>
                            </div>
                            <div />
                        </div>

                        <div className="space-y-lg">
                            {(grammar.sentences || []).slice(0, 10).map((s: any, i: number) => (
                                <div key={i} className="relative p-xl bg-surface border border-border rounded-clay group hover:bg-surface-muted/30 transition-all duration-700 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/5">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/10 group-hover:bg-primary transition-all duration-700" />
                                    <div className="space-y-md pl-md relative z-10 w-full overflow-hidden">
                                        <div className="text-h2 font-black text-foreground jp-text leading-relaxed tracking-tightest group-hover:text-primary-dark transition-colors duration-700 truncate min-h-[1.5em]" dangerouslySetInnerHTML={{ __html: s.ja }} />
                                        <div className="text-body font-bold text-foreground/40 italic truncate max-w-full">“{s.en}”</div>
                                    </div>
                                    <div className="absolute top-6 right-6 text-metadata font-black text-foreground/5 pointer-events-none group-hover:text-primary/5 transition-colors">#{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Structure & Metadata */}
                <div className="xl:col-span-4 space-y-xl">
                    <section className="p-xl bg-surface border border-border rounded-clay shadow-xl space-y-lg group/c">
                        <div className="flex items-center gap-sm border-b border-border/50 pb-lg">
                            <Layers size={18} className="text-primary-dark" />
                            <h2 className="text-metadata font-black text-foreground/40 uppercase tracking-[0.4em]">Structural Construction</h2>
                        </div>
                        <div className="space-y-lg flex-1">
                            {structure.variants && Object.entries(structure.variants).map(([name, code]: [string, any]) => {
                                if (!code) return null;
                                const displayMap = typeof code === 'object' ? code : { [name]: code };
                                return Object.entries(displayMap).map(([subName, html]: [string, any]) => (
                                    <div key={subName} className="space-y-sm group/v">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">{subName} FORMULATION</span>
                                        <div className="p-lg bg-surface-muted/30 rounded-xl border border-border text-metadata font-black text-foreground/70 jp-text leading-loose truncate group-hover/v:border-primary/20 transition-all" dangerouslySetInnerHTML={{ __html: html }} />
                                    </div>
                                ));
                            })}
                            {!structure.variants && <div className="py-xl text-center border-2 border-dashed border-border/50 rounded-xl text-metadata font-black text-foreground/10 uppercase tracking-widest">No Construction Data</div>}
                        </div>
                    </section>

                    {related.length > 0 && (
                        <section className="p-xl bg-surface border border-border rounded-clay shadow-xl space-y-lg group/n">
                            <div className="flex items-center gap-sm border-b border-border/50 pb-lg">
                                <BookOpen size={18} className="text-foreground/30" />
                                <h2 className="text-metadata font-black text-foreground/40 uppercase tracking-[0.4em]">Nuance Network</h2>
                            </div>
                            <div className="space-y-sm">
                                {related.slice(0, 5).map((relObj: any, i: number) => {
                                    const rel = relObj.related;
                                    return (
                                        <Link key={i} href={`/content/grammar/${rel.slug}`} className="block relative p-lg rounded-xl bg-surface-muted/10 border border-transparent hover:border-primary/20 transition-all hover:bg-surface-muted/30 group/node overflow-hidden">
                                            <div className="text-card-title font-black text-foreground/60 group-hover/node:text-primary-dark transition-colors jp-text truncate">{rel.character || rel.meaning}</div>
                                            <div className="text-metadata font-black text-foreground/20 uppercase tracking-tight mt-1 line-clamp-1 italic truncate">{rel.meaning}</div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {resources.online?.length > 0 && (
                        <section className="p-xl bg-surface border border-border rounded-clay shadow-xl space-y-lg">
                            <div className="flex items-center gap-sm border-b border-border/50 pb-lg">
                                <ExternalLink size={18} className="text-foreground/30" />
                                <h2 className="text-metadata font-black text-foreground/40 uppercase tracking-[0.4em]">External Archives</h2>
                            </div>
                            <div className="space-y-sm">
                                {resources.online.slice(0, 3).map((link: any, i: number) => (
                                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-lg rounded-xl border border-border hover:border-primary/20 transition-all group/link h-16">
                                        <span className="text-metadata font-black text-foreground/40 group-hover/link:text-primary transition-colors uppercase tracking-widest truncate">{link.label || 'Archive Source'}</span>
                                        <ChevronLeft size={14} className="text-foreground/10 rotate-180 group-hover/link:text-primary transition-all shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
