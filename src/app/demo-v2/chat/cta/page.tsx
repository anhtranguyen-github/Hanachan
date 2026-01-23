import React from 'react';
import Link from 'next/link';

export default function ChatbotCTA() {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center px-4">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-vocab rounded-full flex items-center justify-center text-white font-black text-xl shadow-md">H</div>
                    <h2 className="font-bold text-gray-900 leading-tight">Contextual Learning Mode</h2>
                </div>
            </header>

            <div className="flex-1 bg-white border border-gray-300 rounded-[48px] shadow-sm flex flex-col overflow-hidden relative">
                <div className="flex-1 p-10 overflow-auto space-y-8 blur-[2px]">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-vocab shrink-0"></div>
                        <div className="bg-gray-50 p-6 rounded-[32px] rounded-tl-none max-w-[80%] border border-gray-300">
                             <p className="text-gray-700 font-medium">You just used the word "勉強" (study) in your review. Would you like to practice using it in a sentence?</p>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-40 top-0 flex items-center justify-center p-12 bg-white/20 backdrop-blur-[1px]">
                    <div className="bg-white border-2 border-vocab/30 p-10 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] text-center space-y-6 max-w-md">
                        <h3 className="text-2xl font-black text-gray-800">Practice Suggestion</h3>
                        <p className="text-gray-500 font-medium">I noticed you're struggling with <span className="text-vocab font-bold">勉強</span>. Want a quick 2-minute drill?</p>
                        <div className="flex flex-col gap-2">
                            <Link href="/demo-v2/chat/cta/modal" className="w-full py-4 bg-vocab text-white font-black rounded-2xl shadow-lg hover:scale-[1.02] transition-all">Start Drill</Link>
                            <button className="w-full py-3 text-gray-400 font-bold text-sm">Maybe later</button>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-50 opacity-20">
                    <div className="relative">
                        <div className="w-full py-5 px-8 bg-gray-50 rounded-3xl h-14"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
