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
    Languages
} from 'lucide-react';

export default function VocabDetail({ params }: { params: { id: string } }) {
    // Demo data matching image 2
    const vocabData = {
        character: "大人",
        reading: "おとな",
        meaning: "ADULT",
        level: 1,
        meaning_strategy: "This word combines BIG and PERSON.",
        reading_strategy: "Exceptional reading: 'Oh, toner!'",
        components: [
            { char: "大", label: "BIG" },
            { char: "人", label: "PERSON" }
        ],
        attributes: [
            { label: "GRAMMAR CLASS", value: "Noun, Na-Adjective" },
            { label: "ACCENT PATTERN", value: "No data" }
        ],
        examples: [
            { j: "あの大人は誰ですか？", e: "Who is that adult?" },
            { j: "大人になりたいです。", e: "I want to become an adult." }
        ]
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans text-[#3E4A61]">
            {/* Tiny Back Button */}
            <Link href="/demo-v2/content/vocab" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors w-fit pt-4">
                <ChevronLeft size={16} />
                Back to Vocabulary Library
            </Link>

            {/* Premium Hero Card */}
            <section className="bg-white border border-[#F0E0E0] rounded-[48px] p-12 md:p-20 shadow-xl shadow-[#3E4A61]/5 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-10 left-10">
                    <span className="px-4 py-1.5 bg-[#3E4A61] text-white text-[10px] font-black uppercase rounded-lg shadow-lg tracking-widest">Level {vocabData.level}</span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
                    <div className="text-[100px] md:text-[140px] font-black tracking-tighter text-[#3E4A61]">
                        {vocabData.character}
                    </div>
                    <div className="flex flex-col items-start text-left space-y-1">
                        <p className="text-2xl md:text-3xl font-bold text-[#FFB5B5] leading-none mb-2">{vocabData.reading}</p>
                        <h1 className="text-7xl md:text-9xl font-black text-[#3E4A61] leading-none tracking-tight uppercase">{vocabData.meaning}</h1>
                        <button className="flex items-center gap-2 text-[#CBD5E0] hover:text-[#FFB5B5] transition-all pt-4">
                            <Volume2 size={24} />
                        </button>
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
                    <p className="text-xl md:text-2xl font-bold leading-relaxed text-[#3E4A61]/80">
                        This word combines <span className="text-[#FFB5B5] font-black uppercase">BIG</span> and <span className="text-[#FFB5B5] font-black uppercase">PERSON</span>.
                    </p>
                </div>

                <div className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 md:p-10 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <Brain size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Reading Strategy</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold leading-relaxed text-[#3E4A61]/80">
                        Exceptional reading: <span className="text-[#FFB5B5] font-black text-3xl">'Oh, toner!'</span>
                    </p>
                </div>
            </div>

            {/* Structural & Attributes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <section className="lg:col-span-8 bg-white border border-[#F0E0E0] rounded-[40px] p-10 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <Layers size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Structural Components</span>
                    </div>
                    <div className="flex flex-wrap gap-6">
                        {vocabData.components.map((c, i) => (
                            <div key={i} className="w-32 h-36 bg-white border border-[#F0E0E0] rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-[#FFB5B5] transition-all shadow-sm">
                                <span className="text-5xl font-black text-[#3E4A61]">{c.char}</span>
                                <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">{c.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="lg:col-span-4 bg-white border border-[#F0E0E0] rounded-[40px] p-10 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <Info size={18} className="text-[#FFB5B5]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Attributes</span>
                    </div>
                    <div className="space-y-8">
                        {vocabData.attributes.map((attr, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">{attr.label}</p>
                                <p className="text-lg font-bold text-[#3E4A61]">{attr.value}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Usage Context */}
            <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-2.5">
                        <Languages size={20} className="text-[#FFB5B5]" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3E4A61]">Usage Context</h3>
                    </div>
                    <div className="px-5 py-2 border border-[#F0E0E0] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                        {vocabData.examples.length} Samples
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {vocabData.examples.map((ex, i) => (
                        <div key={i} className="bg-white border border-[#F0E0E0] rounded-[40px] p-10 md:p-14 shadow-sm hover:border-[#FFB5B5] transition-all group flex flex-col justify-center min-h-[200px]">
                            <p className="text-3xl md:text-4xl font-black text-[#3E4A61] leading-relaxed mb-4">{ex.j}</p>
                            <p className="text-lg md:text-xl font-bold text-[#A0AEC0]">{ex.e}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
