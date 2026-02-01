'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Brain, ArrowRight } from 'lucide-react';

export default function ReviewCloze() {
    return (
        <div className="fixed inset-0 bg-white flex flex-col font-sans text-[#3E4A61] overflow-hidden">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-8 shrink-0">
                <Link href="/demo-v2/review" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#FFB5B5] transition-colors">
                    <ChevronLeft size={16} />
                    Exit Quiz
                </Link>
                <div className="flex gap-2.5">
                </div>
            </header>

            {/* Progress Section */}
            <div className="px-12 py-4 space-y-2 shrink-0 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Progress</span>
                    <span className="text-[10px] font-black text-[#3E4A61]">19 / 42</span>
                </div>
                <div className="h-1.5 bg-[#FFF9F9] rounded-full overflow-hidden">
                    <div className="h-full w-[43%] bg-[#FFB5B5] rounded-full"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-start pt-8 p-6 overflow-auto">
                <div className="w-full max-w-3xl bg-white border border-[#F0E0E0] rounded-[48px] shadow-2xl shadow-[#FFB5B5]/5 flex flex-col overflow-hidden">
                    {/* Tooltip Instruction */}
                    <div className="py-6 border-b border-[#FFF5F5] flex items-center justify-center gap-3">
                        <Brain size={20} className="text-[#3E4A61]" />
                        <p className="text-sm font-bold text-[#3E4A61]">Complete the sentence with the correct particle</p>
                    </div>

                    <div className="flex-1 p-12 md:p-16 flex flex-col items-center space-y-12">
                        <h2 className="text-4xl md:text-5xl font-black text-[#4E5A71] tracking-tight uppercase">Complete the Sentence</h2>

                        {/* Question Box */}
                        <div className="w-full bg-[#F2ECEC]/40 border border-[#F2ECEC] rounded-[40px] p-10 md:p-14 text-center">
                            <p className="text-4xl md:text-5xl font-black text-[#3E4A61] tracking-tight">
                                私は泳ぐこと<span className="text-[#FFA5A5] underline underline-offset-8 decoration-4 mx-2">_____</span>。
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="w-full max-w-lg relative group flex flex-col items-center gap-8">
                            <input
                                type="text"
                                placeholder="答え..."
                                className="w-full py-8 bg-white border border-[#F0E0E0] rounded-[40px] text-center text-5xl font-black text-[#A0AEC0] outline-none focus:border-[#FFB5B5] focus:text-[#3E4A61] transition-all placeholder:text-[#CBD5E0]/60 shadow-sm"
                                autoFocus
                            />

                            <Link
                                href="/demo-v2/review/sentence"
                                className="group px-10 py-4 bg-[#3E4A61] text-white rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 uppercase"
                            >
                                Submit Answer
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Fill in the blank to complete the Japanese sentence</p>
            </main>
        </div>
    );
}
