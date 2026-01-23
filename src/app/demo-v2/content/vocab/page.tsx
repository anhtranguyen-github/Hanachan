import React from 'react';
import Link from 'next/link';

export default function VocabList() {
    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-4xl font-black text-vocab tracking-tight">Vocabulary Library</h1>
                <div className="flex gap-4">
                    <div className="relative group">
                        <button className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-black text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm">
                            Type: Verbs
                            <span className="text-[10px]">▼</span>
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search word..."
                            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-bold text-gray-800 focus:border-vocab outline-none shadow-sm w-64"
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { j: "食べる", r: "たべる", e: "To eat", l: "12" },
                    { j: "遊ぶ", r: "あそぶ", e: "To play", l: "10" },
                    { j: "学生", r: "がくせい", e: "Student", l: "5" },
                    { j: "先生", r: "せんせい", e: "Teacher", l: "5" },
                    { j: "来る", r: "くる", e: "To come", l: "1" },
                    { j: "行く", r: "いく", e: "To go", l: "1" },
                    { j: "見る", r: "みる", e: "To see", l: "1" },
                    { j: "書く", r: "かく", e: "To write", l: "3" }
                ].map((item, i) => (
                    <Link key={i} href="/demo-v2/content/vocab/1" className="bg-white border-2 border-gray-300 p-8 rounded-[40px] hover:border-vocab hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-4 right-6 text-[10px] font-black text-gray-300 group-hover:text-vocab opacity-50">LV.{item.l}</div>
                        <span className="block text-4xl font-black mb-1 text-gray-900 group-hover:text-vocab transition-colors">{item.j}</span>
                        <span className="block text-xs text-gray-400 font-bold uppercase tracking-tight mb-3">{item.r}</span>
                        <span className="block text-lg text-gray-600 font-bold leading-tight">{item.e}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
