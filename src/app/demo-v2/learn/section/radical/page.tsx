import React from 'react';

export default function RadicalSection() {
    return (
        <div className="space-y-10">
            <header className="flex items-center gap-6">
                <div className="w-20 h-20 bg-radical rounded-3xl shadow-lg"></div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900">Radical Section</h1>
                    <p className="text-gray-500 font-medium">The building blocks of Kanji.</p>
                </div>
            </header>
            <div className="flex flex-wrap gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 bg-radical/5 border border-radical/20 text-radical rounded-2xl font-black text-xl">
                        一
                    </div>
                ))}
            </div>
        </div>
    );
}
