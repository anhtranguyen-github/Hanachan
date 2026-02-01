'use client';

import React from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Target,
    Layers,
    Info,
    BookOpen,
    Volume2,
    Play
} from 'lucide-react';

export default function GrammarDetail({ params }: { params: { id: string } }) {
    // Demo data matching the image structure
    const grammarData = {
        title: "Adjective + て + B",
        subtitle: "~て (Qualities and States)",
        tags: ["And...", "Both and (Conjunctive)"],
        explanation: "The て form of an い-Adjective, or で form of a noun (or な-Adjective) is exactly the same as the て form of a verb, in that it carries the meaning of 'and', and is used for linking. Building on from the adjective +て, noun + で grammar point, instead of linking adjectives, adjective + て + (B) is used for linking an adjective to an entire phrase. With this construction, the phrase is simply added after て (with い-Adjectives), or で (with nouns and な-Adjectives), without any extra consideration for the phrase following it (this means that the (B) phrase will behave as if it was its own sentence). As with adjective +て, noun + で, it should be noted that て and で are different structures here. て is the same conjunction particle that is used with verbs (meaning that い-Adjectives are similar to verbs), while で is actually a form of だ that is used for conjugation. It is the same で as the one that is used in the formal version of だ, である. Which we will learn later.",
        construction: {
            standard: "[い] Adjective [い] + く + て [な] Adjective + で + Phrase Noun + で + Phrase"
        },
        details: [
            { label: "Part of Speech", value: "助詞" },
            { label: "Type", value: "接続助詞" },
            { label: "Register", value: "一般" }
        ],
        examples: [
            {
                j: "トミーは漫画家（まんがか）でたまに学校（がっこう）で国語（こくご）を教（おし）えている。",
                e: "Tommy is a cartoonist, and occasionally teaches the national language at school."
            },
            {
                j: "彼女は優しくて、とても親切な人です。",
                e: "She is kind and a very nice person."
            },
            {
                j: "この店は安くて、美味しいですよ。",
                e: "This shop is cheap and delicious, you know."
            }
        ],
        related: [
            { title: "Adjective + て • Noun + で", tags: "And... (Conjunctive)", level: "N1", desc: "Ready to transform your studies? Learn N5 in under a month! Try now, no credit card required! Try Bunpro Learn More Structure [い] Adjective [..." },
            { title: "し ~ し", tags: "And, Giving reasons", level: "N2", desc: "Ready to transform your studies? Learn N5 in under a month! Try now, no credit card required! Try Bunpro Learn More Structure [い] Adjective [..." }
        ]
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans text-[#3E4A61]">
            {/* Tiny Back Button */}
            <Link href="/demo-v2/content/grammar" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors w-fit pt-4">
                <ChevronLeft size={16} />
                Back to Library
            </Link>

            {/* Hero Header */}
            <header className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-black text-[#3E4A61] tracking-tight">{grammarData.title}</h1>
                    <p className="text-xl font-bold text-[#3E4A61]">{grammarData.subtitle}</p>
                </div>

                <div className="flex gap-3">
                    {grammarData.tags.map((tag, i) => (
                        <span key={i} className="px-5 py-2.5 border border-[#F0E0E0] rounded-2xl text-[11px] font-bold text-[#3E4A61] bg-white shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Logic & Examples */}
                <div className="lg:col-span-8 space-y-12">

                    {/* Explanation Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full border border-[#FFDADA] flex items-center justify-center text-[#FFB5B5]">
                                <Target size={14} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Explanation</span>
                        </div>
                        <div className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 md:p-10 shadow-sm leading-relaxed text-base font-medium text-[#3E4A61]/90">
                            The <span className="text-[#FFB5B5] font-black">て form</span> of an い-Adjective, or <span className="text-[#FFB5B5] font-black">で form</span> of a noun is exactly the same as the て form of a verb, in that it carries the meaning of <span className="text-[#FFB5B5] font-black">'and'</span>, and is used for <span className="text-[#3E4A61] underline decoration-[#FFB5B5]">linking</span>.
                            <br /><br />
                            Building on from the adjective +て, noun + で grammar point, instead of linking adjectives, adjective + て + (B) is used for linking an adjective to an <span className="text-[#FFB5B5] font-black uppercase">entire phrase</span>.
                        </div>
                    </section>

                    {/* Examples Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full border border-[#F0E0E0] flex items-center justify-center text-[#FFB5B5]">
                                <Play size={14} fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Example Sentences (18)</span>
                        </div>
                        <div className="space-y-4">
                            {grammarData.examples.map((ex, i) => (
                                <div key={i} className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 md:p-12 shadow-sm space-y-6">
                                    <p className="text-3xl md:text-4xl font-bold text-[#3E4A61] leading-snug">{ex.j}</p>
                                    <p className="text-lg text-[#A0AEC0] font-medium">{ex.e}</p>
                                    <button className="flex items-center gap-2 text-[#FFB5B5] hover:text-[#FFA5A5] transition-colors pt-2">
                                        <Volume2 size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Play Audio</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Structure & Metadata */}
                <div className="lg:col-span-4 space-y-12">

                    {/* Construction Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Layers size={16} className="text-[#FFB5B5]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Construction</span>
                        </div>
                        <div className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 shadow-sm space-y-6">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Standard</p>
                                <div className="text-lg font-bold text-[#3E4A61] leading-relaxed whitespace-pre-wrap">
                                    {grammarData.construction.standard.split(' ').map((word, i) => (
                                        <span key={i} className={word.includes('[') ? 'text-[#A0AEC0]' : ''}>{word} </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Details Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Info size={16} className="text-[#FFB5B5]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Details</span>
                        </div>
                        <div className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 shadow-sm">
                            <div className="space-y-4">
                                {grammarData.details.map((detail, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-[#A0AEC0]">{detail.label}</span>
                                        <span className="text-[#3E4A61]">{detail.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Related Grammar Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-[#A0AEC0]">
                            <BookOpen size={16} className="text-[#FFB5B5]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Related Grammar ({grammarData.related.length})</span>
                        </div>
                        <div className="space-y-4">
                            {grammarData.related.map((rel, i) => (
                                <div key={i} className="bg-white border border-[#F0E0E0] rounded-[32px] p-8 shadow-sm space-y-4 group hover:border-[#FFB5B5] transition-all cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black text-[#3E4A61]">{rel.title}</h4>
                                            <p className="text-[10px] font-bold text-[#A0AEC0]">{rel.tags}</p>
                                        </div>
                                        <span className="px-2 py-0.5 bg-[#F7FAFC] border border-[#EDF2F7] rounded-md text-[8px] font-black text-[#3E4A61]">{rel.level}</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-[#A0AEC0] line-clamp-3 leading-relaxed">{rel.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
