
import React from 'react';
import { getKanjiData } from '@/lib/data-reader';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { Brain, Layers, BookOpen, ExternalLink, Grid, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function KanjiDemoPage({ searchParams }: { searchParams: { char?: string } }) {
    const character = searchParams.char || '山';
    const kanji = await getKanjiData(character);

    if (!kanji) return <div>Kanji not found in demo data.</div>;

    return (
        <div className="flex flex-col gap-10 p-10 max-w-6xl mx-auto pb-24">
            <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-8 border-b-4 border-primary-dark/5">
                <div className="flex items-center gap-10">
                    <div className="w-48 h-48 bg-white mn-card flex items-center justify-center text-8xl font-black text-primary-dark">
                        {kanji.character}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-pink-100 text-pink-700 text-[10px] font-black rounded-full border-2 border-pink-200 uppercase tracking-widest">Kanji</span>
                            <span className="text-xl font-bold text-primary-dark/40 uppercase tracking-widest">Level {kanji.level}</span>
                        </div>
                        <h1 className="text-7xl font-black text-primary-dark tracking-tighter capitalize">{kanji.meanings.primary[0]}</h1>
                        <div className="flex gap-2 mt-2">
                            {kanji.meanings.alternatives.map((alt: string, i: number) => (
                                <span key={i} className="text-sm font-bold text-primary-dark/40 bg-primary-dark/5 px-3 py-1 rounded-full">{alt}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Mnemonics and Logic */}
                <div className="lg:col-span-2 flex flex-col gap-10">
                    {/* Meaning Section */}
                    <section className="mn-card p-10 bg-white flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-pink-500">
                            <Brain className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Meaning Mnemonic</h2>
                        </div>
                        <RichTextRenderer content={kanji.meanings.mnemonic} className="text-xl leading-relaxed" />
                    </section>

                    {/* Reading Section */}
                    <section className="mn-card p-10 bg-primary-dark text-white flex flex-col gap-6 shadow-mn-lg">
                        <div className="flex items-center gap-3 text-primary">
                            <BookOpen className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Reading Mnemonic</h2>
                        </div>
                        <div className="flex gap-8 items-center mb-4 bg-white/5 p-6 rounded-clay border border-white/10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase opacity-40 mb-1">Onyomi</span>
                                <span className="text-3xl font-black text-white">{kanji.readings.onyomi.length > 0 ? kanji.readings.onyomi.join(', ') : 'None'}</span>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase opacity-40 mb-1">Kunyomi</span>
                                <span className="text-3xl font-black text-primary">{kanji.readings.kunyomi.length > 0 ? kanji.readings.kunyomi.join(', ') : 'None'}</span>
                            </div>
                        </div>
                        <RichTextRenderer content={kanji.readings.mnemonic} className="text-xl leading-relaxed text-white/80" />
                    </section>

                    {/* Found In Vocabulary (Amalgamations) */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark/60">
                            <Grid className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Found In Vocabulary</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {kanji.amalgamations.map((vocab: any, i: number) => (
                                <div key={i} className="mn-card p-6 bg-white hover:-translate-y-1 transition-all group flex items-center justify-between border-2 border-primary-dark/5 hover:border-primary/40">
                                    <div className="flex flex-col">
                                        <div className="text-3xl font-black text-primary-dark mb-1">{vocab.character}</div>
                                        <div className="text-sm font-bold text-primary-dark/40 uppercase tracking-tighter">{vocab.meaning}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-primary group-hover:scale-110 transition-transform">{vocab.reading}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Components and Similar */}
                <div className="flex flex-col gap-10">
                    {/* Radicals Section */}
                    <section className="mn-card p-8 bg-blue-50/30 border-blue-100 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-blue-600">
                            <Layers className="w-6 h-6" />
                            <h2 className="text-lg font-black uppercase tracking-widest">Radicals</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {kanji.radicals.map((rad: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-clay border-2 border-blue-200 shadow-mn-sm hover:scale-[1.02] transition-transform">
                                    <div className="w-12 h-12 flex items-center justify-center text-3xl font-black text-blue-600 bg-blue-50 rounded-lg">
                                        {rad.character}
                                    </div>
                                    <div className="font-black text-primary-dark">{rad.name}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Visually Similar Kanji */}
                    {kanji.visually_similar && kanji.visually_similar.length > 0 && (
                        <section className="mn-card p-8 bg-pink-50/20 border-pink-100 flex flex-col gap-6">
                            <div className="flex items-center gap-3 text-pink-500">
                                <Eye className="w-6 h-6" />
                                <h2 className="text-lg font-black uppercase tracking-widest">Similar Kanji</h2>
                            </div>
                            <div className="flex flex-col gap-4">
                                {kanji.visually_similar.map((sim: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={`/test-render/kanji?char=${sim.character}`}
                                        className="bg-white p-4 rounded-clay border-2 border-pink-100 flex items-center justify-between group hover:border-pink-400 transition-all shadow-mn-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl font-black text-primary-dark group-hover:text-pink-500 transition-colors">
                                                {sim.character}
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-primary-dark/60">{sim.meaning}</p>
                                                <p className="text-[10px] font-bold text-primary-dark/20 uppercase tracking-tighter">{sim.reading}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-primary-dark/10 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Quick Metadata */}
                    <div className="mn-card p-6 bg-white border-primary-dark/5 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-primary-dark/5 pb-2">
                            <span className="text-[10px] font-black uppercase text-primary-dark/30">JLPT</span>
                            <span className="font-black text-primary">N{6 - Math.ceil(kanji.level / 10)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-primary-dark/30">Complexity</span>
                            <span className="font-black text-primary">Level {kanji.level}</span>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="text-center pt-10 border-t-2 border-primary-dark/5">
                <a href={kanji.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-primary-dark/30 hover:text-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                    Source: Learning Platform <ExternalLink className="w-3 h-3" />
                </a>
            </footer>
        </div>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
    )
}
