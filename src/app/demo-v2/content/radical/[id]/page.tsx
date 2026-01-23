import React from 'react';

export default function RadicalDetail() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header with Visual Identity */}
            <header className="text-center space-y-6">
                <div className="w-48 h-48 bg-radical text-white rounded-[48px] flex items-center justify-center text-[120px] font-black shadow-2xl mx-auto transition-transform hover:scale-105">
                    一
                </div>
                <div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight">Ground</h1>
                    <p className="text-xl text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Level 1 Radical</p>
                </div>
            </header>

            {/* Mnemonic Section - Premium Highlight */}
            <section className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Meaning Mnemonic</h3>
                <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-radical transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                    <p className="text-2xl text-gray-800 leading-relaxed font-bold">
                        This radical is just a straight line. It looks like the <span className="text-radical underline decoration-4 underline-offset-8">ground</span>.
                        Imagine standing on a perfectly flat surface, stretching out to the horizon.
                    </p>
                    <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-200 italic text-gray-500 font-medium">
                        "Wait, is it a line or the ground? Just remember: Ground is the foundation for everything."
                    </div>
                </div>
            </section>

            {/* Found In Kanji - Relationship Tracking */}
            <section className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Found In Kanji</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    {['二', '三', '工', '不', '且', '天', '立', '下'].map(k => (
                        <div key={k} className="aspect-square bg-white border-2 border-gray-300 rounded-[28px] flex flex-col items-center justify-center shadow-sm hover:border-kanji hover:bg-kanji/5 hover:-translate-y-1 transition-all group cursor-pointer">
                            <span className="text-3xl font-black text-gray-900 group-hover:text-kanji">{k}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* External Reference (WaniKani/Bunpro Style) */}
            <footer className="pt-12 border-t border-gray-200">
                <div className="flex justify-between items-center text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-widest">Internal ID: RD-001</span>
                    <div className="flex gap-6">
                        <span className="text-xs font-bold hover:text-gray-600 cursor-pointer transition-colors">Dictionary Link</span>
                        <span className="text-xs font-bold hover:text-gray-600 cursor-pointer transition-colors">Study Roadmap</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
