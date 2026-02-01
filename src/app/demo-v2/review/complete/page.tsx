'use client';

import React from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    LayoutDashboard,
    Clock,
    Sparkles,
    Calendar,
    ArrowRight
} from 'lucide-react';

export default function ReviewComplete() {
    return (
        <div className="min-h-screen bg-[#FFFDFD] flex items-center justify-center p-8 sm:p-12">
            <div className="max-w-xl w-full text-center space-y-12">

                {/* 1. Main Icon / Hero */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#FFB5B5]/20 blur-[60px] rounded-full animate-pulse" />
                    <div className="relative w-32 h-32 bg-white border-4 border-[#FFB5B5]/20 rounded-[48px] shadow-2xl flex items-center justify-center group mx-auto">
                        <CheckCircle2 size={64} className="text-[#FFB5B5] group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>

                {/* 2. Text Notification */}
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-[#3E4A61] tracking-tighter uppercase">Session Done!</h1>
                    <p className="text-[#A0AEC0] font-bold text-lg">
                        You just mastered <span className="text-[#3E4A61]">42</span> items in this session.
                    </p>
                </div>

                {/* Added Stats Section for 42 items */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#FFFDFD] border border-[#F0E0E0] p-6 rounded-[32px] shadow-sm">
                        <p className="text-2xl font-black text-[#FFB5B5]">42</p>
                        <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Reviewed</p>
                    </div>
                    <div className="bg-[#FFFDFD] border border-[#F0E0E0] p-6 rounded-[32px] shadow-sm">
                        <p className="text-2xl font-black text-[#4FD1C5]">38</p>
                        <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Correct</p>
                    </div>
                    <div className="bg-[#FFFDFD] border border-[#F0E0E0] p-6 rounded-[32px] shadow-sm">
                        <p className="text-2xl font-black text-[#F6AD55]">4</p>
                        <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Lapsed</p>
                    </div>
                </div>

                {/* 3. Next Review Info Card */}
                <div className="bg-white border-2 border-[#F0E0E0] p-10 rounded-[48px] shadow-sm space-y-8">
                    <div className="flex items-center justify-between pb-6 border-b border-[#F0E0E0]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#FFF5F5] rounded-2xl flex items-center justify-center text-[#FFB5B5]">
                                <Clock size={20} />
                            </div>
                            <span className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-widest">Next Queue update</span>
                        </div>
                        <span className="text-sm font-black text-[#3E4A61]">Today, 8:00 PM</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold px-2">
                            <span className="text-[#A0AEC0]">Estimated Items</span>
                            <span className="text-[#3E4A61]">15 New Reviews</span>
                        </div>
                        <div className="w-full h-3 bg-[#F7FAFC] rounded-full overflow-hidden border border-[#EDF2F7]">
                            <div className="h-full bg-[#FFB5B5] rounded-full w-2/3 shadow-[0_0_10px_rgba(255,181,181,0.5)]" />
                        </div>
                    </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex flex-col gap-4 pt-4">
                    <Link
                        href="/demo-v2/dashboard"
                        className="w-full bg-[#3E4A61] text-white py-6 rounded-[32px] font-black text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-[#3E4A61]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <LayoutDashboard size={20} />
                        BACK TO DASHBOARD
                    </Link>

                    <Link
                        href="/demo-v2/progress"
                        className="w-full bg-white border-2 border-[#F0E0E0] text-[#A0AEC0] py-6 rounded-[32px] font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 hover:border-[#FFB5B5] hover:text-[#FFB5B5] transition-all"
                    >
                        <Calendar size={18} />
                        VIEW SYLLABUS PROGRESS
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {/* 5. Minimalist Tip */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[#CBD5E0] uppercase tracking-widest">
                    <Sparkles size={14} />
                    <span>Good habits lead to long-term mastery</span>
                </div>

            </div>
        </div>
    );
}
