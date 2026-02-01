'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, List, Grid, Book, Filter, Hash, Type, Languages, Swords, Zap, Flame, ChevronLeft } from 'lucide-react';

export default function KanjiLibrary() {
    const kanyis = [
        { char: '一', meaning: 'ONE', level: '1', progress: 100, isPink: true },
        { char: '二', meaning: 'TWO', level: '1', progress: 80, isPink: true },
        { char: '三', meaning: 'THREE', level: '1', progress: 40, isPink: true },
        { char: '四', meaning: 'FOUR', level: '1', progress: 0, isPink: true },
        { char: '五', meaning: 'FIVE', level: '1', progress: 0, isPink: true },
        { char: '六', meaning: 'SIX', level: '2', progress: 0, isPink: true },
        { char: '七', meaning: 'SEVEN', level: '2', progress: 0, isPink: true },
        { char: '八', meaning: 'EIGHT', level: '2', progress: 0, isPink: true },
        { char: '九', meaning: 'NINE', level: '2', progress: 0, isPink: false },
        { char: '十', meaning: 'TEN', level: '2', progress: 0, isPink: false },
        { char: '人', meaning: 'PERSON', level: '2', progress: 90, isPink: true },
        { char: '大', meaning: 'BIG', level: '2', progress: 60, isPink: true },
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 font-sans text-[#3E4A61]">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <Link href="/demo-v2/content" className="flex items-center gap-2 text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors mb-2">
                        <ChevronLeft size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Library</span>
                    </Link>
                    <div className="flex items-center gap-2 text-[#FF6B6B]">
                        <Hash size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">CHARACTER ENCYCLOPEDIA</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#3E4A61]">KANJI</h1>
                </div>

                {/* Status Pills */}
                <div className="flex gap-4">
                    <div className="px-6 py-4 bg-white border border-[#F0E0E0] rounded-2xl shadow-sm text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xl font-black text-[#3E4A61]">2,136</p>
                    </div>
                    <div className="px-6 py-4 bg-[#FFB5B5] text-white rounded-2xl shadow-xl shadow-[#FFB5B5]/20 text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Learned</p>
                        <p className="text-xl font-black">412</p>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0]" size={18} />
                    <input
                        type="text"
                        placeholder="Search meanings or characters..."
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {kanyis.map((item, idx) => (
                    <Link
                        key={idx}
                        href="/demo-v2/content/kanji/1"
                        className="group bg-white border border-[#F0E0E0] rounded-3xl p-6 flex flex-col items-center justify-between min-h-[220px] transition-all hover:border-[#FFB5B5] hover:shadow-xl hover:shadow-[#FFB5B5]/5 cursor-pointer relative overflow-hidden"
                    >
                        {item.progress > 0 && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#F0E0E0]">
                                <div
                                    className="h-full bg-[#FFB5B5]"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        )}

                        <div className="w-full flex justify-between items-start">
                            <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">LEV {item.level}</span>
                            {item.progress === 100 ? (
                                <Zap size={12} className="text-[#FFB5B5]" fill="currentColor" />
                            ) : item.progress > 0 ? (
                                <Flame size={12} className="text-[#FFB5B5]/80" />
                            ) : null}
                        </div>

                        <div className={`text-6xl font-medium my-4 ${item.isPink ? 'text-[#FFB5B5]' : 'text-[#3E4A61]'}`}>
                            {item.char}
                        </div>

                        <div className="w-full space-y-1 text-center">
                            <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest group-hover:text-[#FFB5B5] transition-colors font-mono">KANJI</p>
                            <p className="text-[11px] font-black text-[#3E4A61] uppercase tracking-tight leading-tight group-hover:text-[#FFB5B5] transition-colors">{item.meaning}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
