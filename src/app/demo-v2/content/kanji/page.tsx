import React from 'react';
import Link from 'next/link';

export default function KanjiList() {
    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-4xl font-black text-kanji tracking-tight">Kanji Library</h1>
                <div className="flex gap-4">
                    <div className="relative group">
                        <button className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-black text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm">
                            JLPT: N5
                            <span className="text-[10px]">▼</span>
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search kanji..."
                            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-bold text-gray-800 focus:border-kanji outline-none shadow-sm w-64"
                        />
                    </div>
                </div>
            </header>

            <div className="space-y-10">
                {[
                    { grade: "Level 1", status: "Mastered", items: ["日", "月", "火", "水", "木", "金", "土", "山", "川", "田"] },
                    { grade: "Level 2", status: "In Progress", items: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"] },
                    { grade: "Level 3", status: "New", items: ["口", "目", "耳", "手", "足", "力", "夕", "子", "女", "男"] }
                ].map((group, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black text-gray-800">{group.grade}</h3>
                            <span className="h-[1px] flex-1 bg-gray-100"></span>
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">{group.status}</span>
                        </div>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                            {group.items.map((char, i) => (
                                <Link
                                    key={i}
                                    href="/demo-v2/content/kanji/1"
                                    className="aspect-square bg-white border-2 border-gray-300 rounded-[28px] flex items-center justify-center text-3xl font-black text-gray-900 hover:bg-kanji hover:text-white hover:border-kanji hover:rotate-3 transition-all shadow-sm group"
                                >
                                    {char}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
