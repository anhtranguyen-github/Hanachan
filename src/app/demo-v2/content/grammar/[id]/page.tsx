import React from 'react';

export default function GrammarDetail() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header: Identity & Structure */}
            <header className="bg-white border-2 border-gray-300 p-12 rounded-[56px] shadow-sm relative overflow-hidden space-y-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-grammar/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <span className="px-5 py-2 bg-grammar/10 text-grammar rounded-full text-xs font-black uppercase tracking-[0.2em]">N5 Academy Point</span>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-grammar"></div>)}
                        </div>
                    </div>
                    <h1 className="text-7xl font-black text-gray-900 leading-tight tracking-tight">~は ~ です</h1>
                    <p className="text-3xl text-gray-400 font-bold tracking-tight">Particle: Topic Identification</p>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="flex-1 space-y-2">
                        <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Structure</span>
                        <div className="p-6 bg-gray-50 rounded-3xl border-2 border-gray-200">
                            <p className="text-3xl font-black text-gray-800">[Noun A] <span className="text-grammar">は</span> [Noun B] <span className="text-grammar">です</span></p>
                        </div>
                    </div>
                    <div className="w-full md:w-64 space-y-4">
                        <button className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">Add to SRS</button>
                        <p className="text-[10px] text-center font-black text-gray-400 uppercase tracking-widest italic">Current Progress: 82% Learned</p>
                    </div>
                </div>
            </header>

            {/* In-depth Deep Dive (Bunpro Style) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-12">
                    {/* Explanation */}
                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Explanation</h3>
                        <div className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm space-y-6">
                            <p className="text-xl text-gray-700 leading-relaxed font-bold">
                                The particle <span className="text-grammar italic underline decoration-4 underline-offset-8">は (wa)</span> identifies the topic you are talking about. Think of it as saying "As for A... it is B."
                            </p>
                            <p className="text-xl text-gray-700 leading-relaxed font-bold">
                                <span className="text-grammar">です (desu)</span> concludes the sentence politely. It is the Japanese equivalent of "is", "am", or "are".
                            </p>
                        </div>
                    </section>

                    {/* Nuance & Cautions - Premium Content */}
                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Nuance & Usage</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-blue-50/50 border-2 border-blue-100 p-8 rounded-[40px] space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 bg-blue-100 rounded-xl text-lg">💡</span>
                                    <h4 className="text-lg font-black text-blue-900 uppercase tracking-tight">Topic vs Subject</h4>
                                </div>
                                <p className="text-blue-700 font-bold leading-relaxed">
                                    Unlike the subject marker 'ga', 'wa' marks the overarching topic. It can stay consistent across multiple sentences without needing to be repeated.
                                </p>
                            </div>
                            <div className="bg-orange-50/50 border-2 border-orange-100 p-8 rounded-[40px] space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 bg-orange-100 rounded-xl text-lg">⚠️</span>
                                    <h4 className="text-lg font-black text-orange-900 uppercase tracking-tight">Pronunciation Trap</h4>
                                </div>
                                <p className="text-orange-700 font-bold leading-relaxed">
                                    Even though it is written with the Hiragana 'ha' (は), it is ALWAYS pronounced as 'wa' when functioning as a particle.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar: External Links & Metadata */}
                <aside className="md:col-span-4 space-y-8">
                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Resources</h3>
                        <div className="bg-gray-50 border-2 border-gray-200 p-8 rounded-[40px] space-y-6">
                            {[
                                { name: "Tae Kim's Guide", page: "Topic" },
                                { name: "Genki I", page: "p.42" },
                                { name: "Dictionary of JG", page: "p.51" }
                            ].map((link, i) => (
                                <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white p-3 -m-3 rounded-2xl transition-all">
                                    <span className="text-sm font-black text-gray-900 group-hover:text-grammar">{link.name}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{link.page}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Similar Points</h3>
                        <div className="flex flex-wrap gap-2">
                            {["~は ~ ですか", "~も ~ です"].map(p => (
                                <div key={p} className="px-4 py-3 bg-white border-2 border-gray-300 rounded-2xl text-[10px] font-black text-gray-800 hover:border-grammar hover:text-grammar cursor-pointer transition-all uppercase tracking-widest">
                                    {p}
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Rich Example Sentences */}
            <section className="space-y-8 pt-12">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b-2 border-gray-100 pb-2">Context Sentences</h3>
                <div className="grid gap-6">
                    {[
                        { jp: "私は 日本人です。", en: "I am Japanese.", note: "Self-introduction" },
                        { jp: "田中さんは 先生です。", en: "Mr. Tanaka is a teacher.", note: "Third-party statement" },
                        { jp: "これは 本です。", en: "This is a book.", note: "Object identification" }
                    ].map((ex, i) => (
                        <div key={i} className="bg-white border-2 border-gray-300 p-10 rounded-[48px] shadow-sm hover:border-grammar/30 transition-all flex flex-col md:flex-row justify-between gap-8 group">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-grammar uppercase tracking-widest">{ex.note}</span>
                                <div className="space-y-2">
                                    <p className="text-4xl font-black text-gray-900 group-hover:text-grammar transition-colors">{ex.jp}</p>
                                    <p className="text-2xl text-gray-500 font-bold">{ex.en}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center text-2xl hover:bg-grammar/10 hover:text-grammar transition-all shadow-sm">🔊</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
