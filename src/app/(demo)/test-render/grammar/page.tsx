
import React from 'react';
import { getGrammarData } from '@/lib/data-reader';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { Sparkles, HelpCircle, Layout, ArrowRight, Quote, Volume2, Link2, ChevronRight, Hash, Layers } from 'lucide-react';
import { clsx } from 'clsx';

export default async function GrammarDemoPage({ searchParams }: { searchParams: { slug?: string } }) {
    const slug = searchParams.slug || 'adjective-て-b';
    const grammar = await getGrammarData(slug) as any;

    if (!grammar) return <div>Grammar not found in demo data.</div>;

    // Mapping relationship types for the demo

    // Mapping relationship types for the demo
    const relationships: Record<string, { label: string, color: string }> = {
        'Similar': { label: 'Similar Pattern', color: 'bg-blue-500' },
        'Contrast': { label: 'Contrast', color: 'bg-red-500' },
        'Synonym': { label: 'Synonym', color: 'bg-emerald-500' },
        'Antonym': { label: 'Antonym', color: 'bg-orange-500' }
    };

    return (
        <div className="flex flex-col gap-10 p-10 max-w-6xl mx-auto pb-24">

            <header className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full shadow-mn-sm uppercase tracking-widest">N{6 - Math.ceil((grammar.level || 1) / 10)} Grammar</span>
                    <h1 className="text-6xl font-black text-primary-dark tracking-tighter">{grammar.title}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <p className="text-2xl font-bold text-primary-dark/60 tracking-tight">{grammar.title_with_furigana}</p>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-clay text-[10px] font-black text-primary border border-primary/10 shadow-mn-sm">
                            <Layers className="w-3 h-3" />
                            {grammar.related.length} Related
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-clay text-[10px] font-black text-secondary border border-secondary/10 shadow-mn-sm">
                            <Quote className="w-3 h-3" />
                            {grammar.examples.length} Examples
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content Column */}
                <div className="lg:col-span-2 flex flex-col gap-10">

                    {/* 1. Meaning & Description */}
                    <div className="flex flex-col gap-6">
                        <section className="mn-card p-8 bg-white flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-secondary">
                                <Sparkles className="w-5 h-5 shadow-sm" />
                                <h2 className="text-lg font-black uppercase tracking-widest">About This Pattern</h2>
                            </div>
                            <ul className="list-none flex flex-wrap gap-2">
                                {grammar.meanings.map((m: string, i: number) => (
                                    <li key={i} className="px-4 py-2 bg-secondary/10 text-secondary-dark rounded-clay font-black text-lg border-2 border-secondary/20">
                                        {m}
                                    </li>
                                ))}
                            </ul>
                            <div className="prose prose-hanachan mt-4 text-primary-dark/80 leading-relaxed font-medium">
                                {grammar.about.text}
                            </div>
                        </section>


                        {/* Fun Facts Section */}
                        {grammar.fun_facts && grammar.fun_facts.length > 0 && (
                            <section className="mn-card p-8 bg-blue-50 border-blue-100 flex flex-col gap-4 text-blue-900 shadow-mn-sm">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <ArrowRight className="w-5 h-5" />
                                    <h2 className="text-sm font-black uppercase tracking-widest">Did You Know?</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {grammar.fun_facts.map((fact: string, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                            <p className="text-sm font-bold leading-relaxed">{fact}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Cautions Section */}
                        {grammar.cautions && grammar.cautions.length > 0 && (
                            <section className="mn-card p-8 bg-orange-50 border-orange-100 flex flex-col gap-4 text-orange-900 shadow-mn-sm">
                                <div className="flex items-center gap-3 text-orange-600">
                                    <HelpCircle className="w-5 h-5" />
                                    <h2 className="text-sm font-black uppercase tracking-widest">Cautions</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {grammar.cautions.map((caution: any, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                                            <p className="text-sm font-bold leading-relaxed">{caution.text || caution}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* 2. Interactive Examples */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark/60 px-2">
                            <Quote className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Interactive Examples</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {grammar.examples.map((ex: any, i: number) => (
                                <div key={i} className="mn-card p-8 bg-white hover:scale-[1.01] transition-all group border-l-8 border-l-primary/20">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <RichTextRenderer content={ex.sentence_structure} className="text-2xl font-black text-primary-dark" />
                                        <button className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-mn-sm">
                                            <Volume2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <p className="text-lg font-bold text-primary-dark/40 italic">
                                        {ex.translation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Column */}
                <div className="flex flex-col gap-10">
                    {/* Prerequisites Section */}
                    {grammar.prerequisites && (
                        <section className="mn-card p-8 bg-amber-50 border-amber-200 flex flex-col gap-6 text-amber-900 shadow-mn-sm">
                            <div className="flex items-center gap-3 text-amber-600">
                                <ChevronRight className="w-6 h-6" />
                                <h2 className="text-lg font-black uppercase tracking-widest">Prerequisites</h2>
                            </div>
                            <div className="flex flex-col gap-3">
                                {grammar.prerequisites.map((pre: any, i: number) => (
                                    <div key={i} className="p-3 bg-white/50 rounded-clay border border-amber-200 font-bold text-sm flex justify-between items-center group cursor-pointer hover:bg-white transition-colors">
                                        <span>{pre.title}</span>
                                        <span className="text-[10px] opacity-40 uppercase">{pre.level}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Details Section */}
                    <section className="mn-card p-8 bg-white border-primary-dark/10 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark/60">
                            <HelpCircle className="w-6 h-6" />
                            <h2 className="text-lg font-black uppercase tracking-widest">Details</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center py-2 border-b border-primary-dark/5">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40">Part of Speech</span>
                                <span className="font-black text-primary-dark text-sm">{grammar.details.part_of_speech}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-primary-dark/5">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40">Word Type</span>
                                <span className="font-black text-primary-dark text-sm">{grammar.details.word_type}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40">Register</span>
                                <span className="font-black text-primary-dark text-sm">{grammar.details.register}</span>
                            </div>
                        </div>
                    </section>

                    {/* Structure Section */}
                    <section className="mn-card p-8 bg-primary-dark text-white flex flex-col gap-6 shadow-mn-lg">
                        <div className="flex items-center gap-3 text-primary">
                            <Layout className="w-6 h-6" />
                            <h2 className="text-lg font-black uppercase tracking-widest">Structure</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {grammar.structure.variants && (grammar.structure.variants.standard || grammar.structure.variants.polite) ? (
                                <>
                                    {grammar.structure.variants.standard && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Standard</span>
                                            <div className="p-4 bg-white/5 rounded-clay border border-white/10 font-bold text-primary italic text-base">
                                                {grammar.structure.variants.standard}
                                            </div>
                                        </div>
                                    )}
                                    {grammar.structure.variants.polite && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Polite</span>
                                            <div className="p-4 bg-white/5 rounded-clay border border-white/10 font-bold text-primary italic text-base">
                                                {grammar.structure.variants.polite}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                grammar.structure.patterns.map((p: string, i: number) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-clay border border-white/10 font-bold text-primary italic text-sm">
                                        {p}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Related Grammar Section */}
                    {grammar.related && grammar.related.length > 0 && (
                        <section className="mn-card p-8 bg-white border-2 border-primary-dark/5 flex flex-col gap-6">
                            <div className="flex items-center gap-3 text-primary-dark/60">
                                <Layers className="w-6 h-6" />
                                <h2 className="text-lg font-black uppercase tracking-widest">Related Patterns</h2>
                            </div>
                            <div className="flex flex-col gap-4">
                                {grammar.related.map((rel: any, i: number) => {
                                    const relType = relationships[rel.type] || relationships['Similar'];

                                    return (
                                        <div key={i} className="p-3 rounded-clay border-2 border-primary-dark/5 hover:border-primary group cursor-pointer transition-all bg-primary-dark/[0.01] flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[7px] font-black text-white uppercase tracking-tighter shadow-sm",
                                                    relType.color
                                                )}>
                                                    {relType.label}
                                                </span>
                                                <span className="text-[9px] font-black text-primary opacity-60 uppercase">{rel.level} Grammar</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-primary-dark group-hover:text-primary transition-colors leading-tight text-sm">{rel.title}</h4>
                                                <p className="text-[10px] font-bold text-primary-dark/40 italic mt-0.5 line-clamp-1">{rel.meaning}</p>
                                            </div>
                                            {rel.comparison && (
                                                <p className="text-[9px] font-medium text-primary-dark/50 leading-tight hidden group-hover:block mt-1 pt-2 border-t border-primary-dark/5">
                                                    {rel.comparison}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
}
