import React from 'react';

export default function KanjiSection() {
    return (
        <div className="space-y-10">
            <header className="flex items-center gap-6">
                <div className="w-20 h-20 bg-kanji rounded-3xl shadow-lg"></div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900">Kanji Section</h1>
                    <p className="text-gray-500 font-medium">WaniKani style Kanji learning path.</p>
                </div>
            </header>
            <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-kanji text-white rounded-xl flex items-center justify-center text-2xl font-black shadow-sm">
                        字
                    </div>
                ))}
            </div>
        </div>
    );
}
