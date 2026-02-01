'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, Volume2, Target, Info } from 'lucide-react';

export default function VocabLesson() {
    return (
        <div className="h-full flex flex-col space-y-4 bg-[#FFFDFD] rounded-[40px] p-4 lg:p-6 overflow-auto custom-scrollbar font-sans text-[#3E4A61]">
            {/* Unified Simple Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E0E0] rounded-lg w-fit shadow-sm shrink-0">
                <Bookmark size={12} className="text-[#A0AEC0]" />
                <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Vocabulary • 4 of 5</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-6 min-h-0">
                <div className="w-full max-w-5xl bg-white border-2 border-[#F0E0E0] rounded-[40px] shadow-sm overflow-hidden flex flex-col p-8 md:p-12 transition-all">
                    <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <span className="text-7xl md:text-8xl font-black text-[#3E4A61] leading-none select-none">大人</span>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#F7FAFC] border border-[#EDF2F7] rounded-xl text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] hover:bg-[#FFB5B5] hover:text-white transition-all">
                                <Volume2 size={12} />
                                Listen
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-6 text-center md:text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#FFB5B5] uppercase tracking-[0.2em] leading-none uppercase">おとな</p>
                                <h2 className="text-5xl font-black text-[#3E4A61] tracking-tight uppercase">Adult</h2>
                            </div>

                            <div className="h-px w-full bg-[#F0E0E0]"></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-[#EDF2F7]">
                                    <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Level</p>
                                    <p className="text-xl font-black text-[#3E4A61]">12</p>
                                </div>
                                <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-[#EDF2F7]">
                                    <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Grammar Category</p>
                                    <p className="text-lg font-black text-[#3E4A61] leading-none">Noun</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-[#FFB5B5]" />
                                <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-widest">Meaning Strategy</span>
                            </div>
                            <div className="bg-[#FFFDFD] border border-[#F0E0E0] rounded-2xl p-8 shadow-inner">
                                <p className="text-base md:text-lg font-medium text-[#3E4A61]/80 leading-relaxed">
                                    A <span className="text-[#FFB5B5] font-black">big</span> (大) <span className="text-[#FFB5B5] font-black">person</span> (人) is an <span className="text-[#FFB5B5] font-black">adult</span>. This makes sense because adults are just big people!
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#F7FAFC] flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <Info size={14} className="text-[#A0AEC0]" />
                                <span className="text-[9px] font-black uppercase text-[#A0AEC0]">Components:</span>
                            </div>
                            {['大', '人'].map(c => (
                                <div key={c} className="w-10 h-10 bg-white border border-[#F0E0E0] rounded-xl flex items-center justify-center font-black text-[#3E4A61] hover:border-[#FFB5B5] transition-all cursor-pointer shadow-sm">
                                    {c}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Link
                    href="/demo-v2/learn/lesson-batch/next"
                    className="group px-12 py-4 bg-[#3E4A61] hover:bg-[#4E5A71] text-white rounded-2xl font-black text-base tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 shrink-0 uppercase"
                >
                    Next Lesson
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
