import React from 'react';
import Link from 'next/link';

export default function ChatbotOverview() {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto space-y-8 py-10">
            {/* Chat Header - Assistant Domain session metadata */}
            <header className="flex justify-between items-center px-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 bg-vocab rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-vocab/20">H</div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Hana AI</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-vocab tracking-[0.2em]">Active Session</span>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Thesis v2.0</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="p-3 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400">
                        <span className="text-xl">⋮</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white border-2 border-gray-300 rounded-[64px] shadow-sm flex flex-col overflow-hidden relative">
                {/* Scrollable Message History */}
                <div className="flex-1 p-12 overflow-auto space-y-12">
                    {/* Assistant Message */}
                    <div className="flex gap-6 max-w-[90%] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gray-100 p-8 rounded-[48px] rounded-tl-none border-2 border-gray-200">
                            <p className="text-gray-900 font-bold text-lg leading-relaxed italic">
                                こんにちは！ 오늘의 "日" (Sun) 공부는 어땠나요?
                                <br /><br />
                                (Hello! How was your study of "Sun" today?)
                            </p>
                        </div>
                    </div>

                    {/* User Message */}
                    <div className="flex gap-6 justify-end">
                        <div className="bg-primary p-8 rounded-[48px] rounded-tr-none text-white shadow-2xl shadow-primary/20 max-w-[85%]">
                            <p className="font-black text-xl italic tracking-tight italic">
                                It was good! I still mix up the Onyomi and Kunyomi readings though.
                            </p>
                        </div>
                    </div>

                    {/* Assistant Message with Reference (assistant-er.md logic) */}
                    <div className="flex gap-6 max-w-[90%]">
                        <div className="space-y-6 flex-1">
                            <div className="bg-gray-100 p-8 rounded-[48px] rounded-tl-none border-2 border-gray-200 shadow-sm">
                                <p className="text-gray-900 font-bold text-lg leading-relaxed">
                                    That's very common! <span className="text-kanji underline decoration-4 underline-offset-4">日</span> has many readings depending on the context.
                                </p>
                            </div>

                            {/* MessageReferences Bridge Integration */}
                            <div className="bg-white border-2 border-kanji/10 p-8 rounded-[40px] space-y-6 shadow-xl shadow-gray-50 group hover:border-kanji/40 transition-all">
                                <div className="flex justify-between items-center">
                                    <span className="block text-[10px] font-black uppercase text-kanji tracking-[0.3em]">Hana Recommendation</span>
                                    <span className="px-3 py-1 bg-kanji/5 text-kanji rounded-full text-[8px] font-black uppercase tracking-widest">Linked Study Point</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-kanji text-white rounded-3xl flex items-center justify-center text-5xl font-black shadow-lg group-hover:rotate-6 transition-transform">日</div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-2xl font-black text-gray-900">Sun; Day</p>
                                        <p className="text-sm font-bold text-gray-400">Onyomi: ニチ, ジツ | Kunyomi: ひ, -び</p>
                                    </div>
                                    <Link href="/demo-v2/content/kanji/1" className="px-6 py-4 bg-gray-900 text-white font-black rounded-2xl text-xs hover:bg-black transition-all">
                                        Revise Now →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Input */}
                <div className="p-10 border-t-2 border-gray-100 bg-white/80 backdrop-blur-xl">
                    <div className="relative max-w-3xl mx-auto group">
                        <input
                            type="text"
                            placeholder="Ask me something about Japanese..."
                            className="w-full py-8 px-10 bg-gray-50 border-2 border-transparent focus:border-vocab rounded-[32px] outline-none transition-all font-black text-lg placeholder:text-gray-300"
                        />
                        <button className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-vocab text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-vocab/40 hover:scale-105 active:scale-95 transition-all">
                            <span className="text-3xl">↑</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
