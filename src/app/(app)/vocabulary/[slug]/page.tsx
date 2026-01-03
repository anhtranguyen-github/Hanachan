'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, BookOpen, ExternalLink, Hash, BookType } from 'lucide-react';
import Link from 'next/link';

export default function VocabularyDetailPage({ params }: { params: { slug: string } }) {
    const router = useRouter();

    // Mock Data based on screenshot
    const data = {
        term: "Seven Things",
        kanji: "七つ",
        level: 1,
        type: "VOCABULARY",
        category: "NUMERAL",
        meaning: "Seven Things",
        explanation: `This word follows the "number of things" pattern where there's a kanji for a number plus つ on the end. Whenever you see this, you know the word means "__ things." Knowing that, as long as you know the kanji (which you do) you can figure out what number of things it is. For this one, it's the kanji for <mark>seven</mark> plus つ. So, this one is <mark>seven things</mark>.`
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Nav Back */}
            <div>
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="bg-white hover:bg-white/80 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-full px-6 shadow-sm border border-slate-100"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                </Button>
            </div>

            {/* Header Info */}
            <div className="space-y-4">
                <div className="flex gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {data.type}
                    </span>
                    <span className="px-3 py-1 bg-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        LEVEL {data.level}
                    </span>
                </div>

                <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
                    SEVEN THINGS
                </h1>

                <div>
                    <span className="px-3 py-1 bg-rose-50 text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {data.category}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="app-card p-10 space-y-10">

                        {/* Interactive Meaning Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-300">
                                <BookOpen size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conceptual Essence</span>
                            </div>
                            <div className="w-full bg-rose-50/50 rounded-2xl p-6">
                                <span className="text-xl font-bold text-slate-800">{data.meaning}</span>
                            </div>
                        </div>

                        {/* Semantic Analysis */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-300">
                                <BookType size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Semantic Analysis</span>
                            </div>
                            <p
                                className="text-lg text-slate-600 leading-loose font-medium"
                                dangerouslySetInnerHTML={{
                                    __html: data.explanation.replace(/<mark>/g, '<span class="bg-yellow-200 px-1 rounded-sm mx-1 text-slate-900">').replace(/<\/mark>/g, '</span>')
                                }}
                            />
                        </div>

                    </div>

                    {/* Phonetic Spectrum (Placeholder for bottom section in screenshot cutoff) */}
                    <div className="app-card p-10 opacity-50">
                        <div className="flex items-center gap-3 text-slate-300 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Phonetic Spectrum</span>
                        </div>
                        <div className="h-20 bg-slate-50 rounded-2xl"></div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">

                    {/* Kanji Card */}
                    <div className="app-card p-12 flex items-center justify-center relative min-h-[300px]">
                        <button className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                            <Hash size={18} />
                        </button>
                        <div className="text-8xl font-black text-indigo-400 font-jp">
                            {data.kanji}
                        </div>
                    </div>

                    {/* Learning Status */}
                    <div className="app-card p-6">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Learning Status</div>
                        <div className="inline-flex items-center px-4 py-2 bg-slate-100 rounded-lg">
                            <Hash size={12} className="text-slate-400 mr-2" />
                            <span className="text-xs font-bold text-slate-600">NEW</span>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="#" className="flex justify-center items-center gap-2 py-4 bg-rose-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-rose-100 transition-colors">
                            JISHO <ExternalLink size={12} className="opacity-50" />
                        </Link>
                        <Link href="#" className="flex justify-center items-center gap-2 py-4 bg-rose-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-rose-100 transition-colors">
                            WK <ExternalLink size={12} className="opacity-50" />
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
