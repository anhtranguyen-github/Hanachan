'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, Brain, Target } from 'lucide-react';

export default function RadicalLesson() {
    return (
        <div className="h-full flex flex-col space-y-4 bg-[#FFFDFD] rounded-[40px] p-4 lg:p-6 overflow-auto custom-scrollbar font-sans text-[#3E4A61]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E0E0] rounded-lg w-fit shadow-sm shrink-0">
                <Bookmark size={12} className="text-[#A0AEC0]" />
                <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Radical • 1 of 5</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-6 min-h-0">
                <div className="w-full max-w-5xl bg-white border-2 border-[#F0E0E0] rounded-[40px] shadow-sm overflow-hidden flex flex-col p-8 md:p-12 transition-all">
                    <div className="flex flex-col md:flex-row gap-10 md:gap-20 items-center">
                        <div className="flex items-center justify-center shrink-0">
                            <span className="text-8xl md:text-9xl font-black text-[#87CEEB] leading-none select-none">入</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-4 text-center md:text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] leading-none">Category</p>
                                <h2 className="text-5xl font-black text-[#3E4A61] tracking-tight uppercase">Enter</h2>
                            </div>

                            <div className="h-px w-full bg-[#F0E0E0]"></div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] leading-none">Level</p>
                                <p className="text-3xl font-black text-[#3E4A61]">2</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-[#FFB5B5]" />
                            <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-widest">Meaning Mnemonic</span>
                        </div>
                        <div className="bg-[#FFFDFD] border border-[#F0E0E0] rounded-[32px] p-8 md:p-10 shadow-inner">
                            <p className="text-base md:text-lg font-medium text-[#3E4A61]/80 leading-relaxed text-center md:text-left">
                                Imagine a person bowing their head to <span className="text-[#FFB5B5] font-black">enter</span> a cave. The shape reflects the motion of stepping through an entrance. It consists of two strokes meeting at the top.
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    href="/demo-v2/learn/lesson-batch/next"
                    className="group px-12 py-4 bg-[#87CEEB] hover:bg-[#6BB8D6] text-white rounded-2xl font-black text-base tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 shrink-0 uppercase"
                >
                    Next Lesson
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
