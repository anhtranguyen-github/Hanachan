import React from 'react';
import Link from 'next/link';

export default function GrammarList() {
    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-4xl font-black text-grammar tracking-tight italic">Academy Index</h1>
                <div className="flex gap-4">
                    <div className="relative group">
                        <button className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-black text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm">
                            Level: All
                            <span className="text-[10px]">▼</span>
                        </button>
                    </div>
                    <div className="relative group">
                        <button className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-black text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm">
                            Status: Unlearned
                            <span className="text-[10px]">▼</span>
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search points..."
                            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-2xl text-sm font-bold text-gray-800 focus:border-grammar outline-none shadow-sm w-64"
                        />
                    </div>
                </div>
            </header>

            <div className="bg-white border-2 border-gray-300 rounded-[48px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-300 tracking-widest">Structure</th>
                            <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-300 tracking-widest">Meaning</th>
                            <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-300 tracking-widest">Status</th>
                            <th className="px-10 py-6"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { s: "~は ~ です", m: "Identification particle", l: "N5", st: "Learned" },
                            { s: "~の", m: "Possessive particle", l: "N5", st: "Reviewing" },
                            { s: "~を", m: "Object marker", l: "N5", st: "Unlearned" },
                            { s: "~に / ~へ", m: "Direction particles", l: "N5", st: "Locked" },
                            { s: "~も", m: "Addition particle", l: "N5", st: "New" }
                        ].map((item, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-grammar/5 transition-all group cursor-pointer">
                                <td className="px-10 py-8">
                                    <span className="text-2xl font-black text-gray-900 group-hover:text-grammar transition-colors">{item.s}</span>
                                </td>
                                <td className="px-10 py-8">
                                    <span className="text-lg text-gray-500 font-bold">{item.m}</span>
                                </td>
                                <td className="px-10 py-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.st === 'Learned' ? 'bg-green-100 text-green-600' :
                                            item.st === 'Reviewing' ? 'bg-orange-100 text-orange-600' :
                                                item.st === 'Unlearned' ? 'bg-gray-100 text-gray-400' :
                                                    'bg-blue-100 text-blue-600'
                                        }`}>
                                        {item.st}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <Link href="/demo-v2/content/grammar/1" className="text-xs font-black text-gray-300 group-hover:text-grammar uppercase tracking-widest transition-all">Details →</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
