'use client';

import React from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Target,
    Brain,
    Layers,
    BookOpen,
    Sparkles,
    Link2
} from 'lucide-react';

export default function RadicalDetail({ params }: { params: { id: string } }) {
    // Demo data from radicals.json
    const radicalData = {
        character: "亅",
        level: 1,
        name: "Barb",
        meaning: "Barb",
        mnemonic: [
            {
                content: "This radical is shaped like a **barb**. Kind of like the barb you'd see on a barbed fishing hook. Imagine that thing getting stuck in your arm or something. Not exactly pleasant. Say out loud, 'Oh dang, I got a barb stuck in me!' Alright, relax, it's only a little barb."
            }
        ],
        mnemonic_image: {
            src: "https://files.wanikani.com/37bxlwu06vjf2m8u0wkwbyocvgul",
            alt: "A barb, shown as a vertical line curling up to the left at the bottom."
        },
        kanji_slugs: ["才", "了", "争", "慶"]
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10 font-sans text-[#3E4A61]">
            <Link href="/demo-v2/content/radical" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors w-fit">
                <ChevronLeft size={14} />
                Back to Radical Library
            </Link>

            {/* Header Card */}
            <section className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-10 shadow-xl shadow-[#3E4A61]/5 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#FFF9F9] rounded-full blur-3xl opacity-50"></div>

                <div className="relative group">
                    <div className="w-40 h-40 bg-white border-2 border-[#F0E0E0] rounded-[32px] shadow-lg flex items-center justify-center relative z-10 transition-transform duration-500 overflow-hidden">
                        {radicalData.character ? (
                            <span className="text-8xl font-black text-[#3E4A61]">{radicalData.character}</span>
                        ) : (
                            <img src={radicalData.mnemonic_image.src} alt={radicalData.mnemonic_image.alt} className="w-24 h-24 object-contain opacity-80" />
                        )}
                    </div>
                    <div className="absolute -top-3 -left-3">
                        <span className="px-3 py-1.5 bg-[#3E4A61] text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">Level {radicalData.level}</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2 text-center md:text-left">
                    <p className="text-xl font-black text-[#FFB5B5] tracking-tight uppercase">RADICAL COMPONENT</p>
                    <h1 className="text-7xl font-black text-[#3E4A61] leading-none tracking-tight uppercase">{radicalData.name}</h1>
                </div>
            </section>

            {/* Strategy / Mnemonic */}
            <section className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-10 shadow-sm hover:border-[#FFB5B5] transition-all group">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#FFF5F5] border border-[#FFDADA] flex items-center justify-center text-[#FFB5B5]">
                        <Brain size={16} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] group-hover:text-[#3E4A61] transition-colors">Meaning Mnemonic</span>
                </div>
                <div className="space-y-6 text-base font-medium leading-relaxed text-[#3E4A61]/80 max-w-3xl">
                    {radicalData.mnemonic.map((m, i) => (
                        <p key={i} className="first-letter:text-4xl first-letter:font-black first-letter:text-[#FFB5B5] first-letter:mr-1">
                            {m.content}
                        </p>
                    ))}
                    <div className="p-6 bg-[#F7FAFC] border border-[#EDF2F7] rounded-3xl text-[#A0AEC0] text-sm">
                        "Tip: Visualize the shape as a physical object to anchor the meaning in your memory."
                    </div>
                </div>
            </section>

            {/* Relationships */}
            <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-2.5">
                        <Layers size={18} className="text-[#FFB5B5]" />
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3E4A61]">Component of Kanji</h3>
                    </div>
                    <div className="px-4 py-1.5 border-2 border-[#F0E0E0] rounded-xl text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">
                        {radicalData.kanji_slugs.length} Direct Links
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {radicalData.kanji_slugs.map((k, i) => (
                        <Link
                            key={i}
                            href="/demo-v2/content/kanji/1"
                            className="group aspect-square bg-white border-2 border-[#F0E0E0] rounded-[24px] flex items-center justify-center text-3xl font-black text-[#3E4A61] hover:bg-[#FFF9F9] hover:border-[#FFB5B5] hover:text-[#FFB5B5] hover:-translate-y-1.5 transition-all shadow-sm"
                        >
                            {k}
                        </Link>
                    ))}
                </div>
            </section>

            {/* External Refs */}
            <footer className="pt-6 flex justify-between items-center border-t border-[#F0E0E0] px-4 font-black">
                <div className="flex items-center gap-2 text-[8px] text-[#CBD5E0] uppercase tracking-widest">
                    <Link2 size={12} />
                    Data Source: WaniKani Corpus
                </div>
                <div className="flex gap-4">
                    <button className="text-[8px] text-[#A0AEC0] uppercase tracking-widest hover:text-[#3E4A61]">Jisho Reference</button>
                    <button className="text-[8px] text-[#A0AEC0] uppercase tracking-widest hover:text-[#3E4A61]">Level Index</button>
                </div>
            </footer>
        </div>
    );
}
