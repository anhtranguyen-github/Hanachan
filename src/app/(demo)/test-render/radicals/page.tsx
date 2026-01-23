
import React from 'react';
import { getRadicalData, getKanjiBySlug } from '@/lib/data-reader';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { Sparkles, MessageSquare, ExternalLink, Grid, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default async function RadicalDemoPage() {
    // Using "Barb" as it's the first one in the dataset and has kanji_slugs
    const radical = await getRadicalData('Barb');

    if (!radical) return <div>Radical not found in demo data.</div>;

    // Fetch kanji that use this radical
    const kanjiList = await Promise.all(
        (radical.kanji_slugs || []).slice(0, 10).map(async (slug: string) => {
            return await getKanjiBySlug(slug);
        })
    );
    const filteredKanji = kanjiList.filter(Boolean);

    return (
        <div className="flex flex-col gap-10 p-10 max-w-5xl mx-auto pb-20">
            <header className="flex items-center gap-8">
                <div className="w-40 h-40 bg-blue-500 mn-card flex items-center justify-center text-8xl font-black text-white relative overflow-hidden">
                    {radical.character || radical.name[0]}
                    {!radical.character && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 opacity-20" />
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full border-2 border-blue-200 uppercase tracking-widest">Radical</span>
                        <span className="text-xl font-bold text-primary-dark/40 uppercase tracking-widest">Level {radical.level}</span>
                    </div>
                    <h1 className="text-6xl font-black text-primary-dark tracking-tighter capitalize">{radical.meaning}</h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 flex flex-col gap-10">
                    <section className="mn-card p-8 bg-white flex flex-col gap-6 border-l-8 border-l-blue-500">
                        <div className="flex items-center gap-3 text-blue-500">
                            <Sparkles className="w-6 h-6" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Radical Mnemonic</h2>
                        </div>
                        <RichTextRenderer content={radical.mnemonic} className="text-lg opacity-80" />

                        {radical.mnemonic_image && (
                            <div className="mt-6 p-6 bg-blue-50 rounded-clay border-2 border-blue-100/50 flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Mnemonic Image Reference</span>
                                </div>
                                <div className="flex justify-center bg-white p-4 rounded-lg shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={radical.mnemonic_image.src}
                                        alt={radical.mnemonic_image.alt}
                                        className="h-32 object-contain"
                                    />
                                </div>
                                <p className="text-xs font-bold text-blue-800/60 leading-relaxed italic text-center">
                                    &quot;{radical.mnemonic_image.alt}&quot;
                                </p>
                            </div>
                        )}
                    </section>

                    <div className="mn-card p-6 bg-primary-dark/5 border-dashed flex items-center justify-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary-dark/30" />
                        <p className="font-bold text-primary-dark/40 text-sm">
                            Radicals are the building blocks of Kanji. Learning these first makes Kanji 10x easier.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Found In Kanji Section */}
                    <section className="mn-card p-8 bg-white border-2 border-primary-dark/5 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-primary-dark/60">
                            <Grid className="w-6 h-6" />
                            <h2 className="text-lg font-black uppercase tracking-widest">Found In Kanji</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {filteredKanji.map((k: any, i: number) => (
                                <Link
                                    key={i}
                                    href={`/test-render/kanji?char=${k.character}`}
                                    className="p-4 bg-white rounded-clay border-2 border-primary-dark/5 flex flex-col items-center gap-2 group hover:border-blue-400 transition-all hover:-translate-y-1 shadow-mn-sm"
                                >
                                    <div className="text-4xl font-black text-primary-dark group-hover:text-blue-500 transition-colors">
                                        {k.character}
                                    </div>
                                    <div className="text-[10px] font-black text-primary-dark/20 uppercase tracking-tighter group-hover:text-blue-500/40">
                                        {k.meanings.primary[0].slice(0, 8)}
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="text-center pt-2">
                            <p className="text-[10px] font-black text-primary-dark/20 uppercase">And {(radical.kanji_slugs?.length || 0) - filteredKanji.length} more...</p>
                        </div>
                    </section>
                </div>
            </div>

            <footer className="text-center pt-10 border-t-2 border-primary-dark/5">
                <a href={radical.url} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-primary-dark/30 hover:text-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                    Source: Learning Platform <ExternalLink className="w-3 h-3" />
                </a>
            </footer>
        </div>
    );
}
