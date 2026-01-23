import React from 'react';
import Link from 'next/link';

export default function LearnBatch() {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto space-y-8 py-10">
            {/* Batch Progress - session-er.md logic */}
            <header className="flex justify-between items-center px-6">
                <div className="space-y-2">
                    <div className="flex gap-2.5">
                        {[
                            { state: 'completed' },
                            { state: 'current' },
                            { state: 'pending' },
                            { state: 'pending' },
                            { state: 'pending' }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className={`h-2.5 rounded-full transition-all duration-700 ${item.state === 'completed' ? 'w-12 bg-primary' :
                                        item.state === 'current' ? 'w-16 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]' :
                                            'w-8 bg-gray-100'
                                    }`}
                            ></div>
                        ))}
                    </div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Batch Discovery: 2 / 5 Items Learned</p>
                </div>
                <Link href="/demo-v2/learn/quit" className="group flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest">Abort Batch</span>
                    <span className="text-xl group-hover:rotate-90 transition-transform">✕</span>
                </Link>
            </header>

            <div className="flex-1 bg-white border-2 border-gray-300 rounded-[64px] shadow-sm overflow-hidden flex flex-col relative">
                {/* Visual Cue for 'Learning' state */}
                <div className="absolute top-8 right-10">
                    <span className="px-4 py-2 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        New Discovery
                    </span>
                </div>

                {/* Discovery Content (Radical Example) */}
                <div className="bg-radical p-20 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                    <h2 className="text-[140px] font-black mb-4 relative z-10 drop-shadow-2xl italic">一</h2>
                    <p className="text-2xl font-black opacity-90 relative z-10 tracking-[0.3em] uppercase">Ground</p>
                </div>

                {/* Detailed Information (Content Domain) */}
                <div className="flex-1 p-16 space-y-12 overflow-auto">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300 border-b-2 border-gray-50 pb-2">Mnemonic Strategy</h3>
                        <p className="text-2xl text-gray-700 leading-relaxed font-bold italic">
                            This radical is just a straight line. It looks like the <span className="text-radical underline decoration-4 underline-offset-8">ground</span>.
                            Imagine standing on a perfectly flat surface, stretching out to the horizon.
                        </p>
                    </div>

                    <div className="bg-gray-50 p-10 rounded-[40px] border-2 border-gray-200">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Kanji utilizing this radical</h4>
                        <div className="flex flex-wrap gap-4">
                            {['二', '三', '工', '不', '且'].map(k => (
                                <div key={k} className="w-14 h-14 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-2xl font-black text-gray-800 shadow-sm hover:border-kanji/30 transition-all cursor-help">
                                    {k}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Interaction - batch commits only when all corrected */}
                <footer className="p-10 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="text-xs font-bold text-gray-400">
                        * All 5 items must be acknowledged to complete this batch.
                    </div>
                    <Link
                        href="/demo-v2/learn/lesson-batch/next"
                        className="px-16 py-5 bg-primary text-white font-black rounded-[28px] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xl"
                    >
                        Mastered →
                    </Link>
                </footer>
            </div>
        </div>
    );
}
