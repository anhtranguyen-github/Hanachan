import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, PlayCircle, Download } from 'lucide-react';
import { clsx } from 'clsx';

export default async function KanjiDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const kanji: any = await getLocalKU('kanji', slug);

    if (!kanji) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="mn-card p-12 text-center">
                <h2 className="text-xl font-bold uppercase mb-4 text-foreground">Kanji Not Found</h2>
                <Link href="/content?type=kanji" className="mn-btn mn-btn-primary">BACK TO LIBRARY</Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 px-6">
            <Link href="/content?type=kanji" className="flex items-center gap-3 text-gray-400 hover:text-kanji transition-all font-bold uppercase text-[10px] tracking-widest group mb-8">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Library
            </Link>

            {/* Header: Identity & Stroke Order Animation */}
            <header className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-5 text-center">
                    <div className="w-56 h-56 bg-kanji text-white rounded-[60px] flex items-center justify-center text-[120px] font-black shadow-2xl mx-auto transform hover:rotate-3 transition-transform cursor-help shadow-kanji/30">
                        {kanji.character}
                    </div>
                </div>
                <div className="md:col-span-7 space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="px-5 py-2 bg-kanji/10 text-kanji rounded-full text-[10px] font-black uppercase tracking-widest border border-kanji/20">
                            Level {kanji.level} Kanji
                        </span>
                        <span className="px-5 py-2 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                            JLPT N{5 - Math.floor(kanji.level / 10)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-2 tracking-tight">
                            {kanji.meanings?.[0] || kanji.meaning}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            {kanji.meanings?.slice(1).map((m: string, i: number) => (
                                <span key={i} className="text-lg font-bold text-gray-400">{m}{i < kanji.meanings.slice(1).length - 1 ? ',' : ''}</span>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button className="flex-1 py-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-xs text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                            <Download size={16} /> SVG
                        </button>
                        <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest hover:scale-105 active:scale-95">
                            <PlayCircle size={16} /> Stroke Video
                        </button>
                    </div>
                </div>
            </header>

            {/* Readings & Composition Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-gray-200 p-10 rounded-[48px] shadow-sm space-y-10 hover:border-kanji/30 transition-colors">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-kanji uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-kanji"></span> Onyomi
                        </p>
                        <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-normal">
                            {kanji.onReadings?.join(', ') || <span className="text-gray-300 text-2xl">None</span>}
                        </p>
                    </div>
                    <div className="h-[2px] bg-gray-50 w-full" />
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span> Kunyomi
                        </p>
                        <p className="text-3xl md:text-4xl font-black text-gray-700 tracking-tight leading-normal">
                            {kanji.kunReadings?.join(', ') || <span className="text-gray-300 text-2xl">None</span>}
                        </p>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-200 p-10 rounded-[48px] shadow-sm space-y-8 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-50 pb-4">Composition (Radicals)</h3>
                    <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                        {kanji.radicals?.map((r: any, i: number) => (
                            <Link key={i} href={`/content/radicals/${r.slug}`}>
                                <div className="p-6 bg-gray-50 rounded-3xl border-2 border-gray-100 text-center hover:bg-radical/5 hover:border-radical/30 transition-all cursor-pointer group h-full flex flex-col items-center justify-center gap-2">
                                    <span className="block text-4xl font-black text-gray-800 group-hover:text-radical transition-colors">{r.character || r.slug}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-radical/60">{r.name || 'Radical'}</span>
                                </div>
                            </Link>
                        ))}
                        {(!kanji.radicals || kanji.radicals.length === 0) && (
                            <div className="col-span-2 text-center py-10 text-gray-300 font-bold text-sm">No radical breakdown available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mnemonics - The Heart of Learning */}
            <div className="space-y-12">
                <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2 pl-4">Meaning Mnemonic</h3>
                    <div className="bg-white border-2 border-gray-200 p-10 md:p-12 rounded-[48px] shadow-sm shadow-kanji/5 text-lg md:text-2xl text-gray-700 leading-relaxed font-bold">
                        <RichTextRenderer content={kanji.mnemonics?.meaning || "No mnemonic data available."} />
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2 pl-4">Reading Mnemonic</h3>
                    <div className="bg-white border-2 border-gray-200 p-10 md:p-12 rounded-[48px] shadow-sm shadow-gray-100 text-lg md:text-2xl text-gray-700 leading-relaxed font-bold">
                        <RichTextRenderer content={kanji.mnemonics?.reading || "No reading mnemonic available."} />
                    </div>
                </section>
            </div>

            {/* Related Vocabulary */}
            <section className="space-y-8">
                <div className="flex justify-between items-end px-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Related Vocabulary</h3>
                    <span className="text-[10px] font-black text-kanji uppercase tracking-widest">{kanji.vocabulary?.length || 0} Items Found</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {kanji.vocabulary?.map((v: any, i: number) => (
                        <Link key={i} href={`/content/vocabulary/${v.slug}`}>
                            <div className="bg-white border-2 border-gray-200 p-8 rounded-[40px] shadow-sm flex items-center justify-between hover:border-vocab/30 hover:shadow-vocab/10 transition-all group cursor-pointer relative overflow-hidden min-h-[140px]">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-vocab/5 rounded-bl-[50px] flex items-center justify-center">
                                    <span className="text-[10px] font-black text-vocab/40 uppercase rotate-45 mr-[-10px] mt-[-10px]">Vocab</span>
                                </div>
                                <div className="space-y-1 z-10">
                                    <p className="text-3xl font-black text-gray-900 group-hover:text-vocab transition-colors">{v.character}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{v.reading}</p>
                                </div>
                                <p className="text-lg font-black text-gray-600 max-w-[50%] text-right leading-tight z-10">{v.meaning}</p>
                            </div>
                        </Link>
                    ))}
                    {(!kanji.vocabulary || kanji.vocabulary.length === 0) && (
                        <div className="col-span-2 text-center py-12 border-2 border-dashed border-gray-200 rounded-[40px] text-gray-400 font-bold">
                            No vocabulary found using this Kanji.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

