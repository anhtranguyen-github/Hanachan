import React from 'react';

export default function KanjiDetail() {
    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-20">
            {/* Header: Identity & Stroke Order Animation */}
            <header className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-5 text-center">
                    <div className="w-56 h-56 bg-kanji text-white rounded-[60px] flex items-center justify-center text-[120px] font-black shadow-2xl mx-auto transform hover:rotate-3 transition-transform cursor-help">
                        日
                    </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-kanji/10 text-kanji rounded-full text-xs font-black uppercase tracking-widest">Level 1 Kanji</span>
                        <span className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-black uppercase tracking-widest">JLPT N5</span>
                    </div>
                    <h1 className="text-6xl font-black text-gray-900 leading-tight">Sun, Day</h1>
                    <div className="flex gap-4">
                        <button className="flex-1 py-3 bg-white border-2 border-gray-300 rounded-2xl font-black text-sm text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all">Download SVG</button>
                        <button className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">Watch Stroke Video</button>
                    </div>
                </div>
            </header>

            {/* Readings & Composition Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm space-y-8">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-kanji uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-kanji"></span> Onyomi
                            </p>
                            <p className="text-5xl font-black text-gray-900">ニチ, ジツ</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-200"></span> Kunyomi
                            </p>
                            <p className="text-4xl font-black text-gray-700">ひ, -び, -か</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-50 pb-2">Composition (Radicals)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gray-50 rounded-3xl border-2 border-gray-200 text-center hover:bg-radical/5 hover:border-radical/20 transition-all cursor-pointer group">
                            <span className="block text-4xl font-black text-gray-800 group-hover:text-radical transition-colors">日</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 group-hover:text-radical/60 uppercase">Sun</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mnemonics - The Heart of Learning */}
            <div className="space-y-12">
                <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Meaning Mnemonic</h3>
                    <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm shadow-kanji/5">
                        <p className="text-2xl text-gray-800 leading-relaxed font-bold">
                            The sun is a circle with a line through it. However, because it's hard to draw circles with calligraphy brushes, it became a <span className="text-kanji underline decoration-4 underline-offset-8 italic">square sun</span> with a line in the middle.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Reading Mnemonic</h3>
                    <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm shadow-gray-100">
                        <p className="text-2xl text-gray-800 leading-relaxed font-bold">
                            When the <span className="text-kanji">Sun</span> (日) comes up, it's <span className="text-kanji underline decoration-4 underline-offset-8">Nee-chi</span> (Nichi). Imagine a tiny <span className="bg-gray-100 px-2 rounded">Knee</span> that is <span className="bg-gray-100 px-2 rounded">Itchy</span>. Nichi!
                        </p>
                    </div>
                </section>
            </div>

            {/* Related Vocabulary */}
            <section className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Related Vocabulary</h3>
                    <button className="text-xs font-black text-kanji uppercase tracking-widest hover:underline">View All 42 Items</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { word: "日本", reading: "にほん", meaning: "Japan", type: "Noun" },
                        { word: "今日", reading: "きょう", meaning: "Today", type: "Adverb" },
                        { word: "毎日", reading: "まいにch", meaning: "Every day", type: "Adverb" },
                        { word: "休日", reading: "きゅうじつ", meaning: "Holiday", type: "Noun" }
                    ].map((v, i) => (
                        <div key={i} className="bg-white border-2 border-gray-300 p-8 rounded-[40px] shadow-sm flex items-center justify-between hover:border-vocab/30 transition-all group cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-vocab/5 rounded-bl-[40px] flex items-center justify-center">
                                <span className="text-[10px] font-black text-vocab/40 uppercase rotate-45">{v.type}</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-3xl font-black text-gray-900 group-hover:text-vocab transition-colors">{v.word}</p>
                                <p className="text-sm text-gray-400 font-bold uppercase tracking-tight">{v.reading}</p>
                            </div>
                            <p className="text-xl font-black text-gray-600">{v.meaning}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
