import React from 'react';
import Link from 'next/link';

export default function ReviewItem() {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto space-y-6 py-6">
            <header className="flex justify-between items-center px-6">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <span className="block text-xl font-black text-kanji leading-none">10 / 115</span>
                        <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest">Items in queue</span>
                    </div>
                    <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div className="w-[10%] h-full bg-kanji shadow-[0_0_10px_rgba(var(--kanji-rgb),0.5)]"></div>
                    </div>
                </div>

                {/* Extra Session Info - from session-er.md */}
                <div className="flex gap-4 items-center">
                    <div className="bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 italic text-[10px] font-black text-orange-400">
                        Intra-session Loop Active
                    </div>
                    <Link href="/demo-v2/review" className="text-gray-300 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors">
                        End Session
                    </Link>
                </div>
            </header>

            <div className="flex-1 bg-white border-2 border-gray-300 rounded-[56px] shadow-sm flex flex-col overflow-hidden relative">
                {/* Content Header - The Question Aspect */}
                <div className="bg-kanji p-20 text-center text-white relative">
                    <div className="absolute top-6 left-10 flex gap-2">
                        {/* Status for different aspects of the same KU */}
                        <div className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black tracking-widest uppercase">Reading: ?</div>
                        <div className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black tracking-widest uppercase opacity-40">Meaning: Lock</div>
                    </div>
                    <h2 className="text-[160px] font-black leading-none drop-shadow-2xl">水</h2>
                </div>

                <div className="flex-1 p-16 space-y-12">
                    {/* Input Area */}
                    <div className="space-y-6 text-center max-w-xl mx-auto">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="た . . ."
                                className="w-full py-10 bg-gray-50 border-b-8 border-gray-200 focus:border-kanji rounded-t-[40px] text-center text-6xl font-black transition-all outline-none placeholder:opacity-20"
                                autoFocus
                            />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-kanji rounded-t-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        </div>
                        <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4">Aspect: Onyomi Reading</p>
                    </div>

                    {/* Simulation Section for Demo Purposes */}
                    <div className="pt-12 border-t border-gray-100">
                        <div className="flex flex-col items-center gap-8">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Simulate Result (Commit to Progress Domain)</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                <Link
                                    href="/demo-v2/review/item/incorrect"
                                    className="px-6 py-5 bg-red-500 text-white font-black rounded-[28px] shadow-lg shadow-red-200 text-center hover:scale-105 transition-transform"
                                >
                                    <span className="block text-xl leading-none">Again</span>
                                    <span className="text-[8px] uppercase tracking-widest opacity-60">Reset Stability</span>
                                </Link>
                                <button className="px-6 py-5 bg-orange-500 text-white font-black rounded-[28px] shadow-lg shadow-orange-200 text-center hover:scale-105 transition-transform opacity-30 cursor-not-allowed">
                                    <span className="block text-xl leading-none">Hard</span>
                                    <span className="text-[8px] uppercase tracking-widest opacity-60">Slight Boost</span>
                                </button>
                                <Link
                                    href="/demo-v2/review/item/correct"
                                    className="px-6 py-5 bg-green-500 text-white font-black rounded-[28px] shadow-lg shadow-green-200 text-center hover:scale-105 transition-transform"
                                >
                                    <span className="block text-xl leading-none">Good</span>
                                    <span className="text-[8px] uppercase tracking-widest opacity-60">Normal SRS</span>
                                </Link>
                                <button className="px-6 py-5 bg-blue-500 text-white font-black rounded-[28px] shadow-lg shadow-blue-200 text-center hover:scale-105 transition-transform opacity-30 cursor-not-allowed">
                                    <span className="block text-xl leading-none">Easy</span>
                                    <span className="text-[8px] uppercase tracking-widest opacity-60">Huge Boost</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
