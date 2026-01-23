import React from 'react';
import Link from 'next/link';

export default function ReviewEntry() {
    return (
        <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-black text-gray-900">Review Session</h1>
                <p className="text-gray-500">You have 115 items due for review.</p>
            </div>

            <div className="bg-white border-2 border-kanji/20 p-10 rounded-[40px] shadow-xl text-center space-y-8">
                <div className="flex justify-center gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-kanji/20 rounded-md"></div>
                    ))}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-kanji">Active Queue: 10 Items</h2>
                    <p className="text-sm text-gray-400 font-medium">Maintaining long-term memory</p>
                </div>

                <Link
                    href="/demo-v2/review/batch"
                    className="block w-full py-5 bg-kanji text-white text-xl font-black rounded-3xl shadow-lg hover:translate-y-[-2px] transition-all"
                >
                    Begin Reviews
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-300 text-center">
                    <span className="block text-xl font-black text-gray-400">85</span>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Upcoming (24h)</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-300 text-center">
                    <span className="block text-xl font-black text-gray-400">230</span>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Apprentice Items</span>
                </div>
            </div>
        </div>
    );
}
