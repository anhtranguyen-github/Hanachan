import React from 'react';

export default function VocabDetail() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header: Identity & Audio */}
            <header className="flex flex-col md:flex-row items-center gap-10 bg-white border-2 border-gray-300 p-12 rounded-[56px] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-vocab/5 rounded-bl-[100px]"></div>

                <div className="w-56 h-56 bg-vocab text-white rounded-[48px] flex items-center justify-center text-[100px] font-black shadow-2xl transform active:scale-95 transition-transform cursor-pointer relative z-10">
                    食
                </div>

                <div className="space-y-6 flex-1 text-center md:text-left relative z-10">
                    <div className="space-y-2">
                        <div className="flex flex-col md:flex-row items-baseline gap-4">
                            <h1 className="text-7xl font-black text-gray-900 leading-none">食べる</h1>
                            <span className="px-4 py-1.5 bg-vocab/10 text-vocab rounded-full text-xs font-black uppercase tracking-widest">Level 12</span>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <p className="text-3xl text-gray-400 font-black tracking-tight uppercase leading-none">たべる (taberu)</p>
                            {/* Pitch Accent Mock Visualization */}
                            <div className="flex items-end gap-0.5 h-6">
                                <div className="w-1.5 h-[30%] bg-gray-200 rounded-t-sm"></div>
                                <div className="w-1.5 h-[100%] bg-vocab rounded-t-sm"></div>
                                <div className="w-1.5 h-[30%] bg-gray-200 rounded-t-sm"></div>
                                <div className="w-1.5 h-[30%] bg-gray-200 rounded-t-sm"></div>
                                <span className="ml-2 text-[10px] font-black text-gray-300 uppercase">Pitch: Heiban</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <button className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-vocab/20">
                            <span className="text-xl">🔊</span>
                            <span>Play Audio</span>
                        </button>
                        <div className="px-6 py-4 bg-gray-50 text-gray-500 font-black text-sm rounded-2xl border-2 border-gray-200 italic uppercase tracking-widest">
                            Ichidan Verb
                        </div>
                    </div>
                </div>
            </header>

            {/* Core Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Primary Meaning", val: "To Eat", color: "text-vocab" },
                    { label: "JLPT Level", val: "N5", color: "text-gray-900" },
                    { label: "Wanikani Lvl", val: "12", color: "text-gray-500" },
                    { label: "Word Type", val: "Verb", color: "text-gray-900" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white border-2 border-gray-300 p-6 rounded-[32px] shadow-sm text-center space-y-1">
                        <span className="block text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">{stat.label}</span>
                        <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
                    </div>
                ))}
            </div>

            {/* Mnemonics & Kanji Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Vocabulary Mnemonic</h3>
                    <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm h-full">
                        <p className="text-2xl text-gray-800 leading-relaxed font-bold italic">
                            You already know the Kanji <span className="text-kanji">食</span> (Eat). For the vocabulary <span className="text-vocab">食べる</span>, just remember the extra <span className="bg-gray-100 px-2 rounded">る (ru)</span> at the end makes it an active verb.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Kanji Components</h3>
                    <div className="flex flex-col gap-4">
                        {[
                            { char: "食", meaning: "Eat", readings: "SHO, ta", color: "bg-kanji" }
                        ].map((k, i) => (
                            <div key={i} className="p-6 bg-white border-2 border-gray-300 rounded-[32px] shadow-sm flex items-center gap-6 hover:border-kanji/30 transition-all cursor-pointer group">
                                <div className={`w-16 h-16 ${k.color} text-white rounded-2xl flex items-center justify-center text-3xl font-black transition-transform group-hover:scale-110`}>
                                    {k.char}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-black text-gray-900">{k.meaning}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{k.readings}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Premium Example Sentences (Bunpro Style Furigana) */}
            <section className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Context Sentences</h3>
                    <div className="flex gap-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer underline">English</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer opacity-50">Furigana</span>
                    </div>
                </div>
                <div className="space-y-6">
                    {[
                        { jp: "りんごを 食べます。", en: "I eat an apple.", info: "Standard Polite Form" },
                        { jp: "お寿司を 食べたいです。", en: "I want to eat sushi.", info: "Desire Form (~tai)" }
                    ].map((ex, i) => (
                        <div key={i} className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm hover:border-vocab/30 transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bottom-0 w-2 bg-gray-100 group-hover:bg-vocab transition-colors"></div>
                            <div className="flex justify-between items-start gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-vocab uppercase tracking-widest">{ex.info}</span>
                                        </div>
                                        <p className="text-4xl font-black text-gray-900 leading-tight">{ex.jp}</p>
                                    </div>
                                    <p className="text-2xl text-gray-500 font-bold">{ex.en}</p>
                                </div>
                                <button className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center text-2xl hover:bg-vocab/10 hover:text-vocab transition-all shadow-sm">🔊</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
