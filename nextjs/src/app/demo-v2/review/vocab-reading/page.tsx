import React from 'react';
import Link from 'next/link';

export default function ReviewVocabReading() {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto space-y-6 py-6">
            <header className="flex justify-between items-center px-6">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <span className="block text-xl font-black text-vocab leading-none">42 / 115</span>
                        <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest">Items in queue</span>
                    </div>
                    <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div className="w-[36%] h-full bg-vocab shadow-[0_0_10px_rgba(var(--vocab-rgb),0.5)]"></div>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 italic text-[10px] font-black text-orange-400">
                        SRS Mode: Progressive
                    </div>
                    <Link href="/demo-v2/review" className="text-gray-300 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors">
                        End Session
                    </Link>
                </div>
            </header>

            <div className="flex-1 bg-white border-2 border-gray-300 rounded-[56px] shadow-sm flex flex-col overflow-hidden relative">
                {/* Content Header - The Question Aspect */}
                <div className="bg-vocab p-20 text-center text-white relative">

                    <h2 className="text-[120px] font-black leading-none drop-shadow-2xl">日本語</h2>
                    <div className="mt-6 inline-block px-6 py-2 bg-black/10 rounded-2xl backdrop-blur-sm border border-white/10">
                        <span className="text-xl font-bold opacity-80 italic">Japanese Language</span>
                    </div>
                </div>

                <div className="flex-1 p-16 space-y-12 text-center">
                    {/* Input Area */}
                    <div className="space-y-6 text-center max-w-xl mx-auto">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="に . . ."
                                className="w-full py-10 bg-gray-50 border-b-8 border-vocab focus:border-vocab-dark rounded-t-[40px] text-center text-6xl font-black transition-all outline-none placeholder:opacity-20 text-vocab"
                                autoFocus
                                readOnly
                                value="にほ..."
                            />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-vocab rounded-t-full"></div>
                        </div>
                        <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4">Aspect: Vocabulary Reading</p>
                    </div>

                    {/* Hint / Helper for Demo */}
                    <div className="flex justify-center">
                        <div className="animate-bounce p-4 rounded-full bg-vocab/5 border border-vocab/10">
                            <svg className="w-8 h-8 text-vocab" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>

                    {/* Control Bar */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                            <Link
                                href="/demo-v2/review/item/incorrect"
                                className="px-8 py-6 bg-white border-4 border-red-500 text-red-500 font-black rounded-[32px] hover:bg-red-50 transition-all flex flex-col items-center"
                            >
                                <span className="text-2xl">AGAIN</span>
                                <span className="text-[10px] opacity-60">I FORGOT</span>
                            </Link>
                            <Link
                                href="/demo-v2/review/item/correct"
                                className="px-8 py-6 bg-vocab text-white font-black rounded-[32px] shadow-xl shadow-vocab/20 hover:scale-105 transition-all flex flex-col items-center"
                            >
                                <span className="text-2xl">CHECK</span>
                                <span className="text-[10px] opacity-80">ENTER</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
