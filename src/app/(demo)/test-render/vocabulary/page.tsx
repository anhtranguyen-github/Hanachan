
import React from 'react';
import { getVocabData } from '@/lib/data-reader';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { Volume2, MessageCircle, Link2, ExternalLink, Quote, Zap } from 'lucide-react';

export default async function VocabDemoPage() {
    const vocab = await getVocabData('一人');

    if (!vocab) return <div>Vocabulary not found in demo data.</div>;

    return (
        <div className="flex flex-col gap-12 p-10 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row items-end justify-between gap-6 pb-8 border-b-4 border-primary-dark/5">
                <div className="flex items-center gap-10">
                    <div className="w-48 h-48 bg-purple-600 mn-card flex items-center justify-center text-8xl font-black text-white">
                        {vocab.character}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full border-2 border-purple-200 uppercase tracking-widest">Vocabulary</span>
                            <span className="text-xl font-bold text-primary-dark/40 uppercase tracking-widest">Level {vocab.level}</span>
                        </div>
                        <h1 className="text-7xl font-black text-primary-dark tracking-tighter">{vocab.meanings.primary.join(', ')}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-3 bg-primary-dark text-white px-6 py-3 rounded-clay shadow-mn-sm">
                                <span className="text-[10px] font-black uppercase opacity-60">Reading</span>
                                <span className="text-3xl font-black">{vocab.readings.primary}</span>
                                <Volume2 className="w-6 h-6 text-primary cursor-pointer hover:scale-110 active:scale-90 transition-all" />
                            </div>
                            <div className="flex gap-2">
                                {vocab.meanings.word_types.map((type: string, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase text-primary-dark/40 border-2 border-primary-dark/5 px-3 py-1 rounded-full">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 flex flex-col gap-10">
                    {/* Meaning Explanation */}
                    <section className="mn-card p-10 bg-white flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-purple-500">
                            <MessageCircle className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Meaning Explanation</h2>
                        </div>
                        <RichTextRenderer content={vocab.meanings.explanation} className="text-xl leading-relaxed" />
                    </section>

                    {/* Reading Explanation */}
                    <section className="mn-card p-10 bg-white flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark">
                            <Zap className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Reading Explanation</h2>
                        </div>
                        <RichTextRenderer content={vocab.readings.explanation} className="text-xl leading-relaxed" />
                    </section>

                    {/* Context Sentences */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark/60">
                            <Quote className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">In Context</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {vocab.context_sentences.map((sent: any, i: number) => (
                                <div key={i} className="mn-card p-6 bg-white hover:-translate-y-1 transition-all group">
                                    <p className="text-2xl font-black text-primary-dark mb-2 leading-relaxed">
                                        {sent.ja}
                                    </p>
                                    <p className="text-lg font-bold text-primary-dark/40 italic">
                                        {sent.en}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar: Components & Collocations */}
                <div className="flex flex-col gap-10">
                    <section className="mn-card p-8 bg-primary-dark/5 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark/60">
                            <Link2 className="w-6 h-6" />
                            <h2 className="text-lg font-black uppercase tracking-widest">Components</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {vocab.components.map((comp: any, i: number) => (
                                <div key={i} className="bg-white p-4 rounded-clay border-2 border-primary-dark/5 flex items-center justify-between group cursor-pointer hover:border-primary transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-clay flex items-center justify-center text-2xl font-black text-primary">
                                            {comp.character}
                                        </div>
                                        <div>
                                            <p className="font-black text-primary-dark">{comp.meaning}</p>
                                            <p className="text-xs font-bold text-primary-dark/40">{comp.reading}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-primary-dark/10 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Collocations */}
                    <section className="mn-card p-8 bg-purple-50 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-purple-600">
                            < Zap className="w-6 h-6" />
                            <h2 className="text-lg font-black uppercase tracking-widest">Common Uses</h2>
                        </div>
                        <div className="flex flex-col gap-6">
                            {vocab.collocations.map((coll: any, i: number) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black text-purple-600/40 uppercase tracking-widest">{coll.pattern}</p>
                                    <div className="flex flex-col gap-3">
                                        {coll.combinations.map((comb: any, j: number) => (
                                            <div key={j} className="flex flex-col">
                                                <span className="font-black text-primary-dark">{comb.ja}</span>
                                                <span className="text-xs font-bold text-primary-dark/40">{comb.en}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <footer className="text-center pt-20 border-t-2 border-primary-dark/5">
                <a href={vocab.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-primary-dark/30 hover:text-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                    Source: Learning Platform <ExternalLink className="w-3 h-3" />
                </a>
            </footer>
        </div>
    );
}
