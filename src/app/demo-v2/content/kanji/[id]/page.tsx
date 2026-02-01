'use client';

import React from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Target,
    Brain,
    Layers,
    Info,
    Volume2,
    Combine,
    Eye
} from 'lucide-react';

export default function KanjiDetail({ params }: { params: { id: string } }) {
    // Kanji data with the same clean architecture
    const kanjiData = {
        character: "工",
        level: 1,
        onyomi: "こう",
        meaning: "CONSTRUCTION",
        meaning_alternatives: ["Industry"],
        meaning_strategy: "The construction radical and the construction kanji are the same! This kanji also means industry, which is what construction is.",
        reading_strategy: "Every time a kanji uses the こう reading, we'll use the character こういち (Koichi). Stand next to the construction site.",
        radicals: [
            { character: "工", name: "CONSTRUCTION" }
        ],
        visually_similar: ["土", "干", "王"],
        amalgamations: [
            { character: "人工", meaning: "Artificial", reading: "じんこう" },
            { character: "工場", meaning: "Factory", reading: "こうじょう" }
        ]
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans text-[#3E4A61]">
            {/* Tiny Back Button */}
            <Link href="/demo-v2/content/kanji" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors w-fit pt-4">
                <ChevronLeft size={16} />
                Back to Kanji Library
            </Link>

            {/* Hero Card */}
            <section className="bg-white border border-[#F0E0E0] rounded-[48px] p-10 md:p-16 shadow-xl shadow-[#3E4A61]/5 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-8 left-8">
                    <span className="px-4 py-1.5 bg-[#3E4A61] text-white text-[10px] font-black uppercase rounded-lg shadow-lg tracking-widest">Level {kanjiData.level}</span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full max-w-5xl">
                    <div className="relative group shrink-0">
                        {/* Stroke Order Animation Placeholder */}
                        <div className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] bg-[#F7FAFC] border-2 border-[#F0E0E0] rounded-[40px] flex items-center justify-center relative overflow-hidden shadow-inner">
                            {/* Grid lines to make it look technical */}
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                <div className="border border-[#EDF2F7] border-dashed"></div>
                                <div className="border border-[#EDF2F7] border-dashed"></div>
                                <div className="border border-[#EDF2F7] border-dashed"></div>
                                <div className="border border-[#EDF2F7] border-dashed"></div>
                            </div>
                            <span className="text-[100px] md:text-[130px] font-black text-[#3E4A61] relative z-10 animate-pulse">
                                {kanjiData.character}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0 flex-1">
                        <p className="text-xl md:text-2xl font-bold text-[#FFB5B5] leading-none mb-3">{kanjiData.onyomi}</p>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#3E4A61] leading-tight tracking-tight uppercase break-words w-full">
                            {kanjiData.meaning}
                        </h1>
                    </div>
                </div>
            </section>

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 md:p-10 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Target size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Meaning Strategy</span>
                    </div>
                    <p className="text-lg md:text-xl font-bold leading-relaxed">
                        The <span className="text-[#FFB5B5] underline underline-offset-4">construction radical</span> and the <span className="text-[#FFB5B5] underline underline-offset-4">construction kanji</span> are the same! This kanji also means <span className="text-[#FFB5B5] font-black">industry</span>, which is what construction is.
                    </p>
                </div>

                <div className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 md:p-10 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Brain size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Reading Strategy</span>
                    </div>
                    <p className="text-lg md:text-xl font-bold leading-relaxed">
                        Every time a kanji uses the <span className="text-[#FFB5B5] font-black">こう</span> reading, we'll use the character <span className="text-[#3E4A61] underline decoration-[#FFB5B5]">こういち</span> (Koichi). Stand next to the <span className="text-[#FFB5B5] font-black uppercase">construction site</span>.
                    </p>
                </div>
            </div>

            {/* Composition & Similarity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <section className="lg:col-span-12 bg-white border border-[#F0E0E0] rounded-[40px] p-10 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <Layers size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Structural Components</span>
                    </div>
                    <div className="flex flex-wrap gap-6">
                        {kanjiData.radicals.map((rad, i) => (
                            <div key={i} className="w-32 h-36 bg-white border border-[#F0E0E0] rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-[#FFB5B5] transition-all shadow-sm cursor-pointer">
                                <span className="text-5xl font-black text-[#3E4A61]">{rad.character}</span>
                                <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">{rad.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Similar & Amalgamations Row */}
                <section className="lg:col-span-5 bg-white border border-[#F0E0E0] rounded-[40px] p-10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <Eye size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Visually Similar</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {kanjiData.visually_similar.map((char, i) => (
                            <div key={i} className="aspect-square bg-[#F7FAFC] border border-[#EDF2F7] rounded-3xl flex items-center justify-center text-3xl font-black text-[#3E4A61] hover:bg-white hover:border-[#FFB5B5] transition-all cursor-pointer">
                                {char}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <Combine size={18} className="text-[#FFB5B5]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A0AEC0]">Common Amalgamations</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {kanjiData.amalgamations.map((v, i) => (
                            <div key={i} className="bg-white border border-[#F0E0E0] rounded-[32px] p-6 shadow-sm hover:border-[#FFB5B5] transition-all group flex items-center justify-between cursor-pointer">
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-[#3E4A61] group-hover:text-[#FFB5B5] transition-colors">{v.character}</p>
                                    <p className="text-[9px] text-[#A0AEC0] font-black uppercase tracking-widest">{v.reading}</p>
                                </div>
                                <p className="text-base font-bold text-[#A0AEC0]">{v.meaning}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
