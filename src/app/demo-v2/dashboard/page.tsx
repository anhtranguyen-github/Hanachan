import React from 'react';

export default function Dashboard() {
    return (
        <div className="space-y-8 pb-10">
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Konnichiwa, Hana!</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mastery Level 12</span>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    {/* Streak Counter - from User Domain */}
                    <div className="bg-orange-50 px-6 py-3 rounded-2xl border-2 border-orange-100 flex items-center gap-3">
                        <span className="text-2xl animate-pulse">🔥</span>
                        <div>
                            <span className="block text-xl font-black text-orange-600 leading-none">15</span>
                            <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest">Day Streak</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* SRS Summary - High Level Stats */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-primary text-white p-8 rounded-[40px] shadow-xl shadow-primary/20 relative overflow-hidden group cursor-pointer">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[60px] transform group-hover:scale-110 transition-transform"></div>
                        <span className="block text-5xl font-black mb-1">42</span>
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Lessons Available</span>
                        <div className="mt-6 flex items-center gap-2 text-xs font-bold">
                            <span>Start Learning</span>
                            <span>→</span>
                        </div>
                    </div>

                    <div className="bg-kanji text-white p-8 rounded-[40px] shadow-xl shadow-kanji/20 relative overflow-hidden group cursor-pointer">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[60px] transform group-hover:scale-110 transition-transform"></div>
                        <span className="block text-5xl font-black mb-1">115</span>
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Reviews Due</span>
                        <div className="mt-6 flex items-center gap-2 text-xs font-bold">
                            <span>Ready to Review</span>
                            <span>→</span>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-gray-300 p-8 rounded-[40px] flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Precision</span>
                            <span className="block text-4xl font-black text-gray-900">94.2%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="w-[94%] h-full bg-green-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accuracy Breakdown - from LearningLog (Progress Domain) */}
                <div className="col-span-12 lg:col-span-4 bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Today's Activity</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-400">Correct Answers</span>
                            <span className="text-xl font-black text-green-400">128</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-400">Incorrect Retries</span>
                            <span className="text-xl font-black text-red-400">8</span>
                        </div>
                        <div className="pt-4 border-t border-gray-800">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="block text-xs font-bold text-gray-500">Daily Goal</span>
                                    <span className="text-lg font-black italic">136 / 200 items</span>
                                </div>
                                <span className="text-xs font-bold text-primary">68%</span>
                            </div>
                            <div className="h-6 mt-2 bg-gray-800 rounded-2xl p-1">
                                <div className="w-[68%] h-full bg-primary rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level progression detail */}
                <div className="col-span-12 bg-white border-2 border-gray-300 p-10 rounded-[48px] space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900">Level 12 Progression</h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">Passing Kanji is required to level up</p>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black text-kanji">24</span>
                            <span className="text-xl font-black text-gray-300"> / 30</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-10 h-3 rounded-full transition-all duration-500 ${i < 24 ? 'bg-kanji shadow-[0_0_10px_rgba(var(--kanji-rgb),0.3)]' : 'bg-gray-100'}`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
