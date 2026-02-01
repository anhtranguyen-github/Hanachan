'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Target, ArrowRight } from 'lucide-react';

export default function ReviewSentence() {
    return (
        <div className="fixed inset-0 bg-white flex flex-col font-sans text-[#3E4A61] overflow-hidden">
            <header className="h-16 flex items-center justify-between px-8 shrink-0">
                <Link href="/demo-v2/review" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#CBD5E0] transition-colors">
                    <ChevronLeft size={16} />
                    Exit Quiz
                </Link>
                <div className="flex gap-2.5">
                </div>
            </header>

            <div className="px-12 py-4 space-y-2 shrink-0 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Progress</span>
                    <span className="text-[10px] font-black text-[#3E4A61]">20 / 42</span>
                </div>
                <div className="h-1.5 bg-[#FFF9F9] rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-[#FFB5B5] rounded-full"></div>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 p-6 overflow-auto">
                <div className="w-full max-w-3xl bg-white border border-[#F0E0E0] rounded-[48px] shadow-2xl shadow-[#CBD5E0]/5 flex flex-col overflow-hidden">
                    <div className="py-6 border-b border-[#F7FAFC] flex items-center justify-center gap-3">
                        <Target size={20} className="text-[#3E4A61]" />
                        <p className="text-sm font-bold text-[#3E4A61]">Translate this sentence into English</p>
                    </div>

                    <div className="flex-1 p-10 md:p-14 flex flex-col items-center space-y-10">
                        <div className="w-full bg-white border-2 border-[#F0E0E0] rounded-[40px] p-10 md:p-14 text-center shadow-inner">
                            <p className="text-3xl md:text-4xl font-black text-[#3E4A61] tracking-tight leading-relaxed">
                                海で泳ぐことが好きです。
                            </p>
                        </div>

                        <h2 className="text-4xl font-black text-[#4E5A71] tracking-tight uppercase pt-6">Translation Task</h2>

                        <div className="w-full relative group">
                            <input
                                type="text"
                                placeholder="Translate..."
                                className="w-full py-6 md:py-8 bg-white border border-[#EDF2F7] rounded-[40px] text-center text-3xl font-black text-[#3E4A61] outline-none transition-all placeholder:text-[#CBD5E0]/60 shadow-sm"
                                autoFocus
                            />
                        </div>

                        <Link
                            href="/demo-v2/review/complete"
                            className="group px-10 py-4 bg-[#3E4A61] text-white rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 uppercase"
                        >
                            Finish Session
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                <p className="mt-10 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Complete the translation to finalize your review</p>
            </main>
        </div>
    );
}
