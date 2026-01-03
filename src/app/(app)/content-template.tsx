'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/ui/components/ui/button';
import { Search, Filter, ChevronRight, Hash, BookOpen } from 'lucide-react';
import { PageHeader } from '@/ui/components/PageHeader';

export default function ContentListPage({ params }: { params: { type: string } }) {
    return null;
}

export function ContentListLayout({ title, data, type }: { title: string, data: any[], type: 'radicals' | 'kanji' | 'vocabulary' | 'grammar' }) {

    const Icon = type === 'radicals' ? Hash : BookOpen;
    const badgeMap = {
        radicals: 'BLUE',
        kanji: 'RED',
        vocabulary: 'PURPLE',
        grammar: 'GREEN'
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <PageHeader
                title={title}
                badge={badgeMap[type]}
                badgeColor={
                    type === 'radicals' ? 'bg-blue-100 text-blue-600' :
                        type === 'kanji' ? 'bg-rose-100 text-rose-600' :
                            type === 'vocabulary' ? 'bg-purple-100 text-purple-600' :
                                'bg-emerald-100 text-emerald-600'
                }
                action={
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-100 text-sm focus:ring-2 focus:ring-rose-200 outline-none w-64" placeholder="Search..." />
                    </div>
                }
            />

            <div className="app-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Character</th>
                            <th className="px-6 py-4">Meaning</th>
                            {type !== 'radicals' && type !== 'grammar' && <th className="px-6 py-4">Reading</th>}
                            <th className="px-6 py-4">Level</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${type === 'radicals' ? 'bg-blue-50 text-blue-500' :
                                            type === 'kanji' ? 'bg-rose-50 text-rose-500' :
                                                type === 'vocabulary' ? 'bg-purple-50 text-purple-500' :
                                                    'bg-emerald-50 text-emerald-500'
                                        }`}>
                                        {item.char}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">{item.meaning}</td>
                                {type !== 'radicals' && type !== 'grammar' && (
                                    <td className="px-6 py-4 text-slate-500">{item.reading}</td>
                                )}
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">
                                        {type === 'grammar' ? item.level : `LVL ${item.level}`}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={type === 'vocabulary' && item.char === '七つ' ? '/vocabulary/seven-things' : '#'} className="inline-flex w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors">
                                        <ChevronRight size={16} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
