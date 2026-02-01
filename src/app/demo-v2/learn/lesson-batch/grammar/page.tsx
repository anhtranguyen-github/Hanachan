'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, Sparkles, Layers, BookOpen, MessageCircle } from 'lucide-react';

export default function GrammarLesson() {
    return (
        <div className="h-full flex flex-col space-y-4 bg-[#FFFDFD] rounded-[40px] p-4 lg:p-6 overflow-auto custom-scrollbar font-sans text-[#3E4A61]">
            {/* Unified Simple Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#F0E0E0] rounded-lg w-fit shadow-sm shrink-0">
                <Bookmark size={12} className="text-[#A0AEC0]" />
                <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Grammar • 5 of 5</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-6 min-h-0">
                {/* Main Content Card */}
                <div className="w-full max-w-5xl bg-white border-2 border-[#F0E0E0] rounded-[40px] shadow-sm overflow-hidden flex flex-col p-6 md:p-10 transition-all">

                    {/* Top Section: Title & Meaning */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#FFB5B5] uppercase tracking-[0.3em] leading-none">Grammar Point</p>
                            <h1 className="text-4xl md:text-5xl font-black text-[#3E4A61] tracking-tight">~は ~ です</h1>
                        </div>
                        <div className="pb-1">
                            <p className="text-lg md:text-xl font-black text-[#A0AEC0] uppercase tracking-wider bg-[#F7FAFC] px-4 py-1.5 rounded-xl border border-[#EDF2F7]">
                                To be (Identity)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Side: Construction (Focus) */}
                        <div className="lg:col-span-12">
                            <div className="bg-[#3E4A61] text-white rounded-[28px] p-6 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transform group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="p-1.5 bg-white/10 rounded-lg">
                                        <Layers size={14} className="text-[#FFB5B5]" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Formation Rule</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-black tracking-tight relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <span className="bg-white/10 px-3 py-1 rounded-xl">Noun A</span>
                                    <span className="text-[#FFB5B5] text-xl">は</span>
                                    <span className="bg-white/10 px-3 py-1 rounded-xl">Noun B</span>
                                    <span className="text-[#FFB5B5] text-xl">です</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Explanation & Example */}
                        <div className="lg:col-span-6 space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <Sparkles size={14} className="text-[#FFB5B5]" />
                                <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">Logic</span>
                            </div>
                            <div className="bg-[#F7FAFC] border border-[#EDF2F7] rounded-3xl p-6 min-h-[100px] flex items-center">
                                <p className="text-sm font-medium text-[#3E4A61]/80 leading-relaxed">
                                    Use this to equate <span className="font-black text-[#3E4A61]">A</span> with <span className="font-black text-[#3E4A61]">B</span>. The particle <span className="text-[#FFB5B5] font-black">は</span> (wa) marks the topic, and <span className="text-[#FFB5B5] font-black">です</span> (desu) creates a polite ending.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-6 space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <BookOpen size={14} className="text-[#FFB5B5]" />
                                <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">Example</span>
                            </div>
                            <div className="bg-white border-2 border-[#F7FAFC] rounded-3xl p-6 min-h-[100px] shadow-sm flex flex-col justify-center">
                                <p className="text-xl font-black text-[#3E4A61] mb-1">私は学生です。</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">I am a student</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="w-full max-w-5xl flex flex-col items-center pt-2">
                    <Link
                        href="/demo-v2/learn/lesson-batch/next"
                        className="group px-12 py-3.5 bg-[#3E4A61] hover:bg-[#4E5A71] text-white rounded-2xl font-black text-sm tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-[#3E4A61]/20 transition-all active:scale-95 uppercase"
                    >
                        COMPLETE LESSON
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <p className="mt-4 text-[9px] font-black text-[#CBD5E0] uppercase tracking-[0.3em] flex items-center gap-2">
                        <MessageCircle size={10} />
                        View detailed discussion
                    </p>
                </div>
            </div>
        </div>
    );
}
