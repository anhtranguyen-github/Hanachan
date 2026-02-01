import React from 'react';
import Link from 'next/link';
import { BookOpen, Hash, Type, Languages, Quote, ChevronRight } from 'lucide-react';

export default function LearnEntry() {
    const items = [
        { type: 'RADICAL', char: '氵', name: 'Water', color: '#87CEEB' },
        { type: 'KANJI', char: '海', name: 'Sea', color: '#FFB5B5' },
        { type: 'VOCAB', char: '泳ぐ', name: 'To swim', color: '#BEE3F8' },
        { type: 'GRAMMAR', char: '～ができる', name: 'Can do', color: '#FED7D7' },
        { type: 'SENTENCE', char: '海で泳ぐ...', name: 'I can swim...', color: '#CBD5E0' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-12 flex flex-col items-center justify-center min-h-[90vh]">
            <div className="w-full bg-white border-2 border-[#F0E0E0] p-10 md:p-16 rounded-[48px] shadow-2xl shadow-[#3E4A61]/5 space-y-12 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[#FFF5F5] rounded-full blur-3xl opacity-50"></div>

                <div className="text-center space-y-4 relative z-10">
                    <div className="w-20 h-20 bg-[#FFF5F5] rounded-[32px] flex items-center justify-center mx-auto text-[#FFB5B5] shadow-inner mb-6">
                        <BookOpen size={32} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-[#3E4A61] tracking-tighter uppercase">Ready to Learn</h1>
                        <p className="text-[#A0AEC0] font-bold text-sm">You are about to learn 5 new items in this batch.</p>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-4 relative z-10">
                    {items.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 group">
                            <div
                                className="w-full aspect-square bg-white border-2 border-[#F0E0E0] rounded-[24px] flex items-center justify-center text-2xl font-black transition-all group-hover:border-[#FFB5B5] group-hover:scale-105 shadow-sm"
                                style={{ color: item.color }}
                            >
                                {item.char}
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black text-[#A0AEC0] uppercase tracking-widest">{item.type}</p>
                                <p className="text-[10px] font-black text-[#3E4A61] truncate max-w-[70px]">{item.name}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6 relative z-10">
                    <Link
                        href="/demo-v2/learn/lesson-batch"
                        className="w-full max-w-sm py-5 bg-[#FFB5B5] hover:bg-[#FF9999] text-white text-lg font-black rounded-[24px] shadow-xl shadow-[#FFB5B5]/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] tracking-widest uppercase"
                    >
                        Start Learning
                        <ChevronRight size={20} />
                    </Link>

                    <p className="text-[9px] font-black text-[#CBD5E0] uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB5B5] animate-pulse"></span>
                        SESSION DATA READY
                    </p>
                </div>
            </div>
        </div>
    );
}
