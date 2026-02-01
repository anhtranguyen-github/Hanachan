'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Target } from 'lucide-react';

export default function LearnRadicalQuiz() {
    return (
        <div className="fixed inset-0 bg-white flex flex-col font-sans text-[#3E4A61] overflow-hidden">
            <header className="h-16 flex items-center justify-between px-8 shrink-0">
                <Link href="/demo-v2/learn/lesson-batch/radical" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#87CEEB] transition-colors">
                    <ChevronLeft size={16} />
                    Exit Lesson
                </Link>
                <div className="flex gap-2.5">
                    <div className="px-5 py-2 border border-[#F0E0E0] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                        Checkpoint Quiz
                    </div>
                    <div className="px-5 py-2 border border-[#87CEEB]/20 bg-[#87CEEB]/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#6BB8D6]">
                        Radical
                    </div>
                </div>
            </header>

            <div className="px-12 py-4 space-y-2 shrink-0 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Batch Progress</span>
                    <span className="text-[10px] font-black text-[#3E4A61]">1 / 8</span>
                </div>
                <div className="h-1.5 bg-[#F2F9FC] rounded-full overflow-hidden">
                    <div className="h-full w-[12.5%] bg-gradient-to-r from-[#87CEEB] to-[#6BB8D6] rounded-full"></div>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 p-6 overflow-auto">
                <div className="w-full max-w-2xl bg-white border border-[#F0E0E0] rounded-[48px] shadow-2xl shadow-[#87CEEB]/5 flex flex-col overflow-hidden">
                    <div className="py-6 border-b border-[#F2F9FC] flex items-center justify-center gap-3">
                        <Target size={20} className="text-[#87CEEB]" />
                        <p className="text-sm font-bold text-[#3E4A61]">What is the meaning of this radical?</p>
                    </div>

                    <div className="flex-1 p-10 md:p-14 flex flex-col items-center space-y-10">
                        <div className="relative">
                            <div className="w-40 h-40 bg-white border border-[#F0E0E0] rounded-[40px] shadow-xl flex items-center justify-center text-8xl font-black text-[#87CEEB] relative z-10">
                                入
                            </div>
                            <div className="absolute -bottom-4 -left-10 -right-10 flex flex-col items-center space-y-1">
                                <p className="text-[9px] font-black text-[#CBD5E0] uppercase tracking-widest">Type</p>
                                <p className="text-[10px] font-black text-[#87CEEB] uppercase tracking-[0.3em]">New Radical</p>
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-[#4E5A71] tracking-tight uppercase pt-6">What is the Meaning?</h2>

                        <div className="w-full relative group">
                            <input
                                type="text"
                                placeholder="答え..."
                                className="w-full py-6 md:py-8 bg-white border border-[#F0E0E0] rounded-[40px] text-center text-4xl font-black text-[#A0AEC0] outline-none focus:border-[#87CEEB] focus:text-[#3E4A61] transition-all placeholder:text-[#CBD5E0]/60 shadow-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                <p className="mt-10 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Press Enter to check your answer</p>
            </main>
        </div>
    );
}
