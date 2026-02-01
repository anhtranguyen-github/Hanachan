'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Brain, ArrowRight } from 'lucide-react';

export default function LearnGrammarQuiz() {
    return (
        <div className="fixed inset-0 bg-white flex flex-col font-sans text-[#3E4A61] overflow-hidden">
            <header className="h-16 flex items-center justify-between px-8 shrink-0">
                <Link href="/demo-v2/learn/lesson-batch" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#3E4A61] transition-colors">
                    <ChevronLeft size={16} />
                    Exit Lesson
                </Link>
                <div className="flex gap-2.5">
                </div>
            </header>

            <div className="px-12 py-4 space-y-2 shrink-0 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Batch Quiz Progress</span>
                    <span className="text-[10px] font-black text-[#3E4A61]">5 / 5</span>
                </div>
                <div className="h-1.5 bg-[#FFF9F9] rounded-full overflow-hidden">
                    <div className="h-full w-full bg-[#FFB5B5] rounded-full"></div>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 p-6 overflow-auto">
                <div className="w-full max-w-3xl bg-white border border-[#F0E0E0] rounded-[48px] shadow-2xl shadow-[#FFB5B5]/5 flex flex-col overflow-hidden">
                    <div className="py-6 border-b border-[#FFF5F5] flex items-center justify-center gap-3 bg-[#F7FAFC]/30">
                        <Brain size={20} className="text-[#3E4A61]" />
                        <p className="text-sm font-bold text-[#3E4A61]">Complete the sentence with the correct grammar structure</p>
                    </div>

                    <div className="flex-1 p-10 md:p-14 flex flex-col items-center space-y-12">
                        <h2 className="text-4xl md:text-5xl font-black text-[#4E5A71] tracking-tight uppercase">Grammar Recall</h2>

                        <div className="w-full bg-[#F2ECEC]/40 border border-[#F2ECEC] rounded-[40px] p-10 md:p-14 text-center">
                            <p className="text-3xl md:text-4xl font-black text-[#3E4A61] tracking-tight leading-relaxed">
                                私は泳ぐこと<span className="text-[#FED7D7] underline underline-offset-8 decoration-4 mx-2">_____</span>。
                            </p>
                            <p className="mt-4 text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">I can swim.</p>
                        </div>

                        <div className="w-full max-w-lg relative group">
                            <input
                                type="text"
                                placeholder="答え..."
                                className="w-full py-6 md:py-8 bg-white border border-[#F0E0E0] rounded-[40px] text-center text-4xl font-black text-[#A0AEC0] outline-none focus:border-[#FED7D7] focus:text-[#3E4A61] transition-all placeholder:text-[#CBD5E0]/60 shadow-sm"
                                autoFocus
                            />
                        </div>

                        <div className="w-full max-w-sm flex flex-col gap-3">
                            <Link
                                href="/demo-v2/learn/lesson-batch/complete"
                                className="group w-full py-5 bg-[#3E4A61] text-white rounded-[24px] font-black text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase"
                            >
                                Finish Batch
                                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Fill in the blank to complete the Japanese sentence</p>
            </main>
        </div>
    );
}
