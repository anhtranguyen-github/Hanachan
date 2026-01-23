import React from 'react';
import Link from 'next/link';

export default function CTALearningModal() {
    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-[48px] shadow-2xl max-w-2xl w-full p-12 space-y-12">
                <header className="text-center space-y-4">
                    <div className="flex justify-center -space-x-4">
                        <div className="w-16 h-16 bg-vocab rounded-3xl rotate-[-10deg] shadow-lg flex items-center justify-center text-white text-2xl font-black">勉</div>
                        <div className="w-16 h-16 bg-vocab rounded-3xl rotate-[10deg] shadow-xl flex items-center justify-center text-white text-2xl font-black">強</div>
                    </div>
                    <h2 className="text-3xl font-black">Context Drill: 勉強</h2>
                    <p className="text-gray-400 font-medium">Complete the sentence to reinforce the usage.</p>
                </header>

                <div className="space-y-8 bg-gray-50 p-10 rounded-[40px] border border-gray-300">
                    <p className="text-3xl text-center leading-loose">
                        毎日日本語を <span className="inline-block border-b-4 border-vocab px-4 min-w-[120px]">?</span> います。
                    </p>
                    <p className="text-center text-gray-400 font-bold tracking-widest uppercase text-xs">I [study] Japanese every day.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Link href="/demo-v2/chat" className="py-5 bg-vocab text-white text-xl font-black rounded-3xl text-center shadow-lg hover:translate-y-[-2px] transition-all">勉強して</Link>
                    <button className="py-5 bg-white border-2 border-gray-100 text-gray-700 text-xl font-black rounded-3xl hover:bg-gray-50 transition-all">勉強しに</button>
                </div>

                <div className="text-center">
                    <Link href="/demo-v2/chat/cta" className="text-gray-300 font-bold uppercase text-[10px] tracking-widest hover:text-red-400 transition-colors">Dismiss</Link>
                </div>
            </div>
        </div>
    );
}
