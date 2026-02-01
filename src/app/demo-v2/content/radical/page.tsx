'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ChevronDown, List, Grid, Book, Filter, Hash, Type, Languages, Swords, Zap, Flame, ChevronLeft } from 'lucide-react';

export default function RadicalLibrary() {
    const radicals = [
        { char: '一', meaning: 'GROUND', level: '1', progress: 100 },
        { char: '丨', meaning: 'STICK', level: '1', progress: 100 },
        { char: '丶', meaning: 'DOT', level: '1', progress: 80 },
        { char: '丿', meaning: 'SLIDE', level: '1', progress: 40 },
        { char: '乙', meaning: 'SECOND', level: '1', progress: 0 },
        { char: '亅', meaning: 'BARB', level: '1', progress: 0 },
        { char: '二', meaning: 'TWO', level: '1', progress: 0 },
        { char: '亠', meaning: 'LID', level: '1', progress: 0 },
        { char: '人', meaning: 'PERSON', level: '1', progress: 0 },
        { char: '儿', meaning: 'LEGS', level: '1', progress: 0 },
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 font-sans text-[#3E4A61]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <Link href="/demo-v2/content" className="flex items-center gap-2 text-[#A0AEC0] hover:text-[#FFB5B5] transition-colors mb-2">
                        <ChevronLeft size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Library</span>
                    </Link>
                    <div className="flex items-center gap-2 text-[#FFB5B5]">
                        <Swords size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">PRIMITIVE COMPONENTS</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#3E4A61]">RADICALS</h1>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0]" size={18} />
                    <input
                        type="text"
                        placeholder="Search radical names..."
                        className="w-full py-4 pl-14 pr-6 bg-white border border-[#F0E0E0] rounded-2xl text-[13px] font-medium outline-none focus:border-[#FFB5B5] transition-all placeholder:text-[#CBD5E0]"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {radicals.map((item, idx) => (
                    <Link
                        key={idx}
                        href="/demo-v2/content/radical/1"
                        className="group bg-white border border-[#F0E0E0] rounded-3xl p-6 flex flex-col items-center justify-between min-h-[200px] transition-all hover:border-[#FFB5B5] hover:shadow-xl hover:shadow-[#FFB5B5]/5 cursor-pointer relative overflow-hidden"
                    >
                        {item.progress > 0 && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#F0E0E0]">
                                <div
                                    className="h-full bg-[#FFB5B5]/60"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        )}

                        <div className="w-full flex justify-between items-start">
                            <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">LEV {item.level}</span>
                            {item.progress === 100 && (
                                <Zap size={12} className="text-[#FFB5B5]" fill="currentColor" />
                            )}
                        </div>

                        <div className="text-6xl font-medium my-4 text-[#3E4A61]">
                            {item.char}
                        </div>

                        <div className="w-full space-y-1 text-center">
                            <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest font-mono">RADICAL</p>
                            <p className="text-[11px] font-black text-[#3E4A61] uppercase tracking-tight leading-tight group-hover:text-[#FFB5B5] transition-colors">{item.meaning}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
