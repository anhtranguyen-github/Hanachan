'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ChevronDown, List, Grid, Book, Filter, Hash, Type, Languages, Swords, Zap, Flame, ChevronLeft } from 'lucide-react';

export default function VocabLibrary() {
    const vocab = [
        { char: '一つ', meaning: 'ONE THING', level: '1', progress: 100, isPink: false },
        { char: '二人', meaning: 'TWO PEOPLE', level: '1', progress: 80, isPink: false },
        { char: '食べる', meaning: 'TO EAT', level: '12', progress: 40, isPink: false },
        { char: '学生', meaning: 'STUDENT', level: '5', progress: 0, isPink: false },
        { char: '先生', meaning: 'TEACHER', level: '5', progress: 0, isPink: false },
        { char: '今日', meaning: 'TODAY', level: '3', progress: 0, isPink: false },
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 font-sans text-[#3E4A61]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <Link href="/demo-v2/content" className="flex items-center gap-2 text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors mb-2">
                        <ChevronLeft size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Library</span>
                    </Link>
                    <div className="flex items-center gap-2 text-[#6BA6FF]">
                        <Type size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">VOCABULARY LEXICON</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#3E4A61]">VOCAB</h1>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-4 bg-white border border-[#F0E0E0] rounded-2xl shadow-sm text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Items</p>
                        <p className="text-xl font-black text-[#3E4A61]">12,400</p>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0]" size={18} />
                    <input
                        type="text"
                        placeholder="Search meanings or readings..."
                        className="w-full py-4 pl-14 pr-6 bg-white border border-[#F0E0E0] rounded-2xl text-[13px] font-medium outline-none focus:border-[#FFB5B5] transition-all placeholder:text-[#CBD5E0]"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center justify-between px-6 py-4 bg-white border border-[#F0E0E0] rounded-2xl w-full md:w-48 text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                        LEVELS: 1-60
                        <ChevronDown size={14} className="text-[#A0AEC0]" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {vocab.map((item, idx) => (
                    <Link
                        key={idx}
                        href="/demo-v2/content/vocab/1"
                        className="group bg-white border border-[#F0E0E0] rounded-3xl p-8 flex flex-col items-center justify-between min-h-[240px] transition-all hover:border-[#FFB5B5] hover:shadow-xl hover:shadow-[#FFB5B5]/5 cursor-pointer relative overflow-hidden"
                    >
                        {item.progress > 0 && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#F0E0E0]">
                                <div
                                    className="h-full bg-[#FFBC65]"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        )}

                        <div className="w-full flex justify-between items-start">
                            <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">LEV {item.level}</span>
                            {item.progress === 100 && (
                                <Zap size={12} className="text-[#FFBC65]" fill="currentColor" />
                            )}
                        </div>

                        <div className="text-5xl font-bold my-4 text-[#3E4A61]">
                            {item.char}
                        </div>

                        <div className="w-full space-y-1 text-center">
                            <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest font-mono">VOCABULARY</p>
                            <p className="text-[13px] font-black text-[#3E4A61] uppercase tracking-tight leading-tight group-hover:text-[#FFB5B5] transition-colors">{item.meaning}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
