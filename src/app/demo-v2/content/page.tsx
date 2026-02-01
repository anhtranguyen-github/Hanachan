'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, List, Grid, Book, Filter, Hash, Type, Languages, Swords, Zap, Flame } from 'lucide-react';

export default function ContentHome() {
    const [activeTab, setActiveTab] = useState('ALL');

    const tabs = ['ALL', 'RADICALS', 'KANJI', 'VOCAB', 'GRAMMAR'];

    const items = [
        { type: 'RADICAL', char: '一', meaning: 'GROUND', level: '1', status: 'mastered' },
        { type: 'RADICAL', char: '丨', meaning: 'STICK', level: '1', status: 'learned' },
        { type: 'KANJI', char: '一', meaning: 'ONE', level: '1', status: 'reviewing', progress: 60, isPink: true },
        { type: 'KANJI', char: '二', meaning: 'TWO', level: '1', status: 'learned', progress: 40, isPink: true },
        { type: 'VOCABULARY', char: '一つ', meaning: 'ONE THING', level: '1', status: 'learned' },
        { type: 'VOCABULARY', char: '二人', meaning: 'TWO PEOPLE', level: '1', status: 'learned' },
        { type: 'GRAMMAR', char: 'は', meaning: 'TOPIC MARKER は', level: '1', status: 'learned' },
        { type: 'GRAMMAR', char: 'です', meaning: 'POLITE COPULA です', level: '1', status: 'learned' },
        { type: 'RADICAL', char: '入', meaning: 'ENTER', level: '2', status: 'learned' },
        { type: 'RADICAL', char: 'ハ', meaning: 'HAT', level: '2', status: 'learned' },
        { type: 'KANJI', char: '人', meaning: 'PERSON', level: '2', status: 'learned', isPink: true },
        { type: 'KANJI', char: '大', meaning: 'BIG', level: '2', status: 'learned', isPink: true },
    ];

    return (
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 font-sans text-[#3E4A61]">
            {/* Header: Study Hub / LIBRARY */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#FF6B6B]">
                        <Book size={14} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">STUDY HUB</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#3E4A61]">LIBRARY</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-white border border-[#F0E0E0] p-1 rounded-2xl shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab
                                ? 'bg-[#FFB5B5] text-white shadow-md'
                                : 'text-[#A0AEC0] hover:text-[#3E4A61]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
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
                    <button className="flex items-center justify-between px-6 py-4 bg-white border border-[#F0E0E0] rounded-2xl w-full md:w-64 text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                        GLOBAL STATUS
                        <ChevronDown size={14} className="text-[#A0AEC0]" />
                    </button>
                    <button className="flex items-center justify-between px-6 py-4 bg-white border border-[#F0E0E0] rounded-2xl w-full md:w-48 text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                        LEVELS: 1-60
                        <ChevronDown size={14} className="text-[#A0AEC0]" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="group bg-white border border-[#F0E0E0] rounded-3xl p-6 flex flex-col items-center justify-between min-h-[220px] transition-all hover:border-[#FFB5B5] hover:shadow-xl hover:shadow-[#FFB5B5]/5 cursor-pointer relative overflow-hidden"
                    >
                        {/* Progress Bar (Optional) */}
                        {item.progress && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#F0E0E0]">
                                <div
                                    className="h-full bg-[#FFB5B5]/50"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        )}

                        {/* Top Info */}
                        <div className="w-full flex justify-between items-start">
                            <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">LEV {item.level}</span>
                            {item.status === 'mastered' ? (
                                <Zap size={12} className="text-[#FFB5B5]" fill="currentColor" />
                            ) : (
                                <Flame size={12} className="text-[#FFB5B5]/30" />
                            )}
                        </div>

                        {/* Character */}
                        <div className={`text-6xl font-medium my-4 ${item.isPink ? 'text-[#FFB5B5]' : 'text-[#3E4A61]'}`}>
                            {item.char}
                        </div>

                        {/* Footer Info */}
                        <div className="w-full space-y-1 text-center">
                            <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">{item.type}</p>
                            <p className="text-[11px] font-black text-[#3E4A61] uppercase tracking-tight leading-tight">{item.meaning}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
