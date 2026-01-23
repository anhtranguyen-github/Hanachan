import React from 'react';

export default function ReviewProgress() {
    return (
        <div className="space-y-12 pb-20">
            <header className="space-y-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Review Analytics</h1>
                <p className="text-gray-500 font-bold">Deep dive into your memory retention stats.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Accuracy Chart */}
                <div className="bg-white border-2 border-gray-200 p-10 rounded-[48px] shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-800">Daily Accuracy</h3>
                        <span className="text-sm font-black text-kanji bg-kanji/10 px-4 py-1 rounded-full uppercase tracking-tighter">Last 7 Days</span>
                    </div>
                    <div className="h-48 flex items-end gap-3 border-b-2 border-gray-200 pb-2">
                        {[65, 80, 45, 90, 75, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {h}% Correct
                                </div>
                                <div
                                    style={{ height: `${h}%` }}
                                    className={`w-full rounded-t-xl transition-all ${h > 80 ? 'bg-green-500' : h > 60 ? 'bg-primary' : 'bg-orange-400'
                                        }`}
                                ></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Review Volume Chart */}
                <div className="bg-white border-2 border-gray-200 p-10 rounded-[48px] shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-800">Review Volume</h3>
                        <span className="text-sm font-black text-vocab bg-vocab/10 px-4 py-1 rounded-full uppercase tracking-tighter">Total Hits</span>
                    </div>
                    <div className="h-48 flex items-end gap-3 border-b-2 border-gray-200 pb-2">
                        {[120, 80, 150, 200, 180, 220, 140].map((v, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div
                                    style={{ height: `${(v / 220) * 100}%` }}
                                    className="w-full bg-vocab/20 rounded-t-xl transition-all group-hover:bg-vocab"
                                ></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-3 gap-8 text-center">
                    <div className="space-y-1">
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Accuracy</span>
                        <span className="text-4xl font-black">88.4%</span>
                    </div>
                    <div className="space-y-1 border-x border-white/10 px-8">
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reviews</span>
                        <span className="text-4xl font-black">4,520</span>
                    </div>
                    <div className="space-y-1">
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Study Streak</span>
                        <span className="text-4xl font-black">🔥 24</span>
                    </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}
