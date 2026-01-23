import React from 'react';

export default function VocabSection() {
    return (
        <div className="space-y-10">
            <header className="flex items-center gap-6">
                <div className="w-20 h-20 bg-vocab rounded-3xl shadow-lg"></div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900">Vocab Section</h1>
                    <p className="text-gray-500 font-medium">Essential vocabulary and phrases.</p>
                </div>
            </header>
            <div className="grid gap-4 grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-white border border-gray-300 p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-vocab/10 text-vocab rounded-xl flex items-center justify-center font-bold">A</div>
                        <div>
                            <h3 className="font-bold text-gray-800">Vocabulary Set #{item}</h3>
                            <p className="text-xs text-gray-400">Daily Life • 20 words</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
