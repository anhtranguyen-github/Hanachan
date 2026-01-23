import React from 'react';
import Link from 'next/link';

export default function RadicalList() {
    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-radical tracking-tight">Radical Library</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Building blocks of Kanji</p>
                </div>
                <div className="flex gap-4">
                    <select className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-radical transition-all appearance-none cursor-pointer">
                        <option>Level 1</option>
                        <option>Level 2</option>
                    </select>
                </div>
            </header>

            <div className="space-y-10">
                {[
                    { grade: "Level 1", status: "Mastered", items: ["一", "丨", "丶", "丿", "乙", "亅", "二", "亠", "人", "儿"] },
                    { grade: "Level 2", status: "New", items: ["入", "八", "冂", "冖", "冫", "几", "凵", "刀", "力", "勹"] }
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
                                    href="/demo-v2/content/radical/1"
                                    className="aspect-square bg-white border-2 border-gray-300 rounded-[28px] flex flex-col items-center justify-center shadow-sm hover:bg-radical hover:border-radical hover:rotate-3 transition-all group"
                                >
                                    <span className="text-3xl font-black text-gray-900 group-hover:text-white">{char}</span>
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white/80 uppercase tracking-tighter mt-1">Found.</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
