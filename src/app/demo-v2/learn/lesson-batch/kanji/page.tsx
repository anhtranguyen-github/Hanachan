'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, BookOpen, Brain } from 'lucide-react';

export default function KanjiLesson() {
    return (
        <div className="h-full flex flex-col space-y-4 bg-[#FFFDFD] rounded-[40px] p-4 lg:p-6 overflow-auto custom-scrollbar font-sans text-[#3E4A61]">
            {/* Unified Simple Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E0E0] rounded-lg w-fit shadow-sm shrink-0">
                <Bookmark size={12} className="text-[#A0AEC0]" />
                <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Kanji • 2 of 5</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-6 min-h-0">
                <div className="w-full max-w-5xl bg-white border-2 border-[#F0E0E0] rounded-[40px] shadow-sm overflow-hidden flex flex-col p-8 md:p-10 transition-all">
                    <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
                        {/* Visual Item Display */}
                        <div className="flex items-center justify-center shrink-0">
                            <span className="text-8xl md:text-9xl font-black text-[#FFB5B5] leading-none select-none">日</span>
                        </div>

                        {/* Information Side */}
                        <div className="flex-1 flex flex-col justify-center space-y-6 text-center md:text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] leading-none">Meaning</p>
                                    <h2 className="text-4xl font-black text-[#3E4A61] tracking-tight uppercase">Sun, Day</h2>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] leading-none">Onyomi Reading</p>
                                    <h2 className="text-4xl font-black text-[#3E4A61] tracking-tight">にち</h2>
                                </div>
                            </div>

                            <div className="h-px w-full bg-[#F0E0E0]"></div>

                            <div className="flex gap-8 justify-center md:justify-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] leading-none">Kunyomi</p>
                                    <p className="text-2xl font-black text-[#3E4A61]">ひ, び</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mnemonic Section */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-[#FFB5B5]" />
                                <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-widest">Meaning Strategy</span>
                            </div>
                            <div className="bg-[#FFFDFD] border border-[#F0E0E0] rounded-2xl p-6 shadow-inner min-h-[120px]">
                                <p className="text-sm font-medium text-[#3E4A61]/80 leading-relaxed">
                                    This kanji is a pictograph of the <span className="text-[#FFB5B5] font-black">sun</span>. Imagine a rectangle representing the sun with a line across the middle.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Brain size={14} className="text-[#FFB5B5]" />
                                <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-widest">Reading Strategy</span>
                            </div>
                            <div className="bg-[#FFFDFD] border border-[#F0E0E0] rounded-2xl p-6 shadow-inner min-h-[120px]">
                                <p className="text-sm font-medium text-[#3E4A61]/80 leading-relaxed">
                                    Imagine <span className="text-[#FFB5B5] font-black">Nichi</span>-olas Cage standing on the sun. "Nichi" is the onyx reading you need to remember.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    href="/demo-v2/learn/lesson-batch/next"
                    className="group px-12 py-4 bg-[#FFB5B5] hover:bg-[#FFA5A5] text-white rounded-2xl font-black text-base tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-[#FFB5B5]/20 transition-all active:scale-95 shrink-0 uppercase"
                >
                    Next Lesson
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
