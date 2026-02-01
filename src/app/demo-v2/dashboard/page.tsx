'use client';

import React from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    ChevronRight,
    GraduationCap,
    BookOpen,
    Target,
    TrendingUp
} from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 py-4 font-sans text-[#3E4A61]">
            <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F0E0E0]"></div>
                </div>
                <div className="relative bg-[#FFFDFD] px-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3E4A61]">Suggested Actions</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/demo-v2/review"
                    className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:border-[#FFB5B5] transition-all group min-h-[280px]"
                >
                    <div className="w-14 h-14 rounded-full bg-[#FFF5F5] flex items-center justify-center text-[#FFB5B5] shadow-inner">
                        <TrendingUp size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-[#3E4A61]">24 Reviews Due</h3>
                        <p className="text-xs text-[#A0AEC0] font-bold italic tracking-tight group-hover:text-[#FFB5B5] transition-colors">Time to practice your knowledge!</p>
                    </div>
                </Link>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-xl shadow-[#3E4A61]/5 flex flex-col justify-between relative overflow-hidden group min-h-[280px]">
                    <div className="absolute -right-6 -top-6 text-[#F7FAFC] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                        <GraduationCap size={160} strokeWidth={1} />
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-[#3E4A61]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#3E4A61]">New Content</span>
                            </div>
                            <h3 className="text-3xl font-black text-[#3E4A61]">Level 2</h3>
                            <p className="text-sm font-black text-[#FFB5B5] tracking-tight">Batch 1</p>
                        </div>

                        <div className="bg-[#F2E8E8] rounded-2xl p-4 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">8 New Lessons</span>
                            <div className="flex -space-x-2.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-[#F2E8E8] flex items-center justify-center text-[8px] text-[#A0AEC0]">?</div>
                                ))}
                                <div className="w-6 h-6 rounded-full bg-[#FFB5B5] border-2 border-[#F2E8E8] flex items-center justify-center text-[8px] text-white font-bold">+</div>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/demo-v2/learn/lesson-batch"
                        className="relative z-10 mt-6 w-full py-4 px-8 border-2 border-[#F0E0E0] rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#3E4A61] hover:bg-[#3E4A61] hover:text-white hover:border-[#3E4A61] transition-all group/btn shadow-sm"
                    >
                        Unlock Batch
                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-6 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border-2 border-[#F7FAFC] rounded-xl flex items-center justify-center text-xl font-black text-[#FFB5B5] shadow-sm">
                                2
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Level Progress</h4>
                                <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Walkthrough: 0 / 2 Items</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[#FFB5B5]">15%</span>
                        </div>
                    </div>

                    <div className="h-2.5 bg-[#FFF5F5] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFB5B5] rounded-full shadow-[0_0_8px_rgba(255,181,181,0.5)]" style={{ width: '15%' }}></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Batches Done', icon: <div className="w-3 h-3 rounded-full border-2 border-[#F0E0E0]" /> },
                            { label: 'Reviews < 60', icon: <div className="w-3 h-3 rounded-full border-2 border-[#FFB5B5] bg-[#FFF5F5] flex items-center justify-center"><CheckCircle2 size={8} className="text-[#FFB5B5]" /></div> },
                            { label: '90% Stable', icon: <div className="w-3 h-3 rounded-full border-2 border-[#F0E0E0]" /> }
                        ].map((status, i) => (
                            <div key={i} className="bg-[#F7FAFC] border border-[#EDF2F7] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                                {status.icon}
                                <span className="text-[7px] font-black uppercase tracking-widest text-[#A0AEC0] leading-tight">{status.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2.5">
                        <Target size={14} className="text-[#A0AEC0]" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Batch Overview</h4>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 bg-white border-2 border-[#F0E0E0] rounded-2xl flex items-center gap-3 group cursor-pointer hover:border-[#FFB5B5] transition-all">
                            <div className="w-2 h-2 rounded-full bg-[#87CEEB]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#3E4A61]">Batch 1</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
