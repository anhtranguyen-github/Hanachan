'use client';

import React from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    Trophy,
    ArrowRight,
    LayoutDashboard,
    Sparkles,
    Clock,
    Zap,
    ChevronRight,
    Star
} from 'lucide-react';

export default function LearnComplete() {
    const learnedItems = [
        { char: '氵', type: 'RADICAL', meaning: 'Water', level: 2 },
        { char: '海', type: 'KANJI', meaning: 'Sea', level: 2 },
        { char: '泳ぐ', type: 'VOCAB', meaning: 'To swim', level: 2 },
        { char: '～ができる', type: 'GRAMMAR', meaning: 'Can do', level: 2 },
        { char: '海で泳ぐ...', type: 'SENTENCE', meaning: 'I can swim...', level: 2 },
    ];

    return (
        <div className="min-h-screen bg-[#FFFDFD] p-8 sm:p-12 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">

                {/* 1. Celebration Header */}
                <div className="relative pt-10 pb-2 text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FFB5B5]/10 rounded-full blur-3xl -z-10 animate-pulse" />

                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-[#FFB5B5]/20 rounded-[40px] shadow-2xl mb-8 relative group">
                        <Trophy size={48} className="text-[#FFB5B5] group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#FFB5B5] text-white rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                            <Star size={20} fill="currentColor" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-[#FFB5B5] tracking-[0.2em] uppercase mb-12">Batch Done</h1>
                </div>

                {/* 2. Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {[
                        { label: 'Units Learned', val: '05', icon: <CheckCircle2 size={20} />, color: '#FFB5B5', bg: '#FFF5F5' },
                        { label: 'Time Spent', val: '08:24', icon: <Clock size={20} />, color: '#4FD1C5', bg: '#E6FFFA' },
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-[#F0E0E0] p-8 rounded-[40px] shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                    {stat.icon}
                                </div>
                                <Sparkles className="text-[#F0E0E0] group-hover:text-[#FFB5B5] transition-colors" size={16} />
                            </div>
                            <h3 className="text-4xl font-black text-[#3E4A61] mb-1">{stat.val}</h3>
                            <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest leading-none">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* 3. Items Unlocked */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-black text-[#3E4A61] tracking-tight">Unlocked Knowledge</h2>
                        <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest px-4 py-2 bg-[#F7FAFC] rounded-full border border-[#EDF2F7]">
                            Added to SRS Loop
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {learnedItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-white border-2 border-[#F0E0E0] p-6 rounded-[32px] text-center space-y-4 hover:border-[#FFB5B5] transition-all group cursor-pointer"
                            >
                                <span
                                    className="text-4xl font-black group-hover:scale-110 transition-transform block leading-none"
                                    style={{
                                        color: item.type === 'RADICAL' ? '#87CEEB' :
                                            item.type === 'KANJI' ? '#FFB5B5' :
                                                item.type === 'VOCAB' ? '#BEE3F8' :
                                                    item.type === 'GRAMMAR' ? '#FED7D7' : '#CBD5E0'
                                    }}
                                >
                                    {item.char}
                                </span>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#3E4A61] uppercase truncate">{item.meaning}</p>
                                    <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-tighter">LEV {item.level} {item.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                    <Link
                        href="/demo-v2/learn/lesson-batch"
                        className="flex-1 bg-[#FFB5B5] text-white py-6 rounded-[32px] font-black text-sm tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-[#FFB5B5]/40 hover:bg-[#FFC5C5] hover:scale-[1.02] active:scale-[0.98] transition-all group"
                    >
                        START NEXT BATCH
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        href="/demo-v2/dashboard"
                        className="flex-1 bg-white border-2 border-[#F0E0E0] text-[#3E4A61] py-6 rounded-[32px] font-black text-sm tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#F7FAFC] hover:border-[#3E4A61]/10 transition-all"
                    >
                        <LayoutDashboard size={20} />
                        BACK TO DASHBOARD
                    </Link>
                </div>

                {/* 5. Footer Tip */}
                <div className="p-8 bg-[#F7FAFC] rounded-[40px] border border-[#EDF2F7] flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                        <Sparkles className="text-[#FFB5B5]" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#3E4A61]">Pro Tip: Review in 4 Hours</p>
                        <p className="text-xs text-[#A0AEC0] font-medium">To maximize retention, these items will reappear in your SRS queue soon. Keep it up!</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
