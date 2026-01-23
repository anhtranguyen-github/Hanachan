import React from 'react';
import Link from 'next/link';

export default function ReviewIncorrect() {
    return (
        <div className="h-full flex flex-col items-center justify-center space-y-10">
            <div className="bg-white border-4 border-red-500 p-12 rounded-[56px] text-center shadow-2xl shadow-red-500/10 space-y-8 max-w-sm w-full">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-red-500 tracking-tighter">Incorrect</h1>
                    <p className="text-sm font-bold text-gray-400">Don't worry, let's learn from it.</p>
                </div>

                <div className="bg-red-50 p-6 rounded-3xl space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Correct Answer</p>
                    <p className="text-4xl font-black text-red-600">みず</p>
                    <p className="text-sm text-red-400 font-bold uppercase">mizu</p>
                </div>

                <div className="text-5xl">🛑</div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
                <Link
                    href="/demo-v2/review/item"
                    className="w-full py-5 bg-red-500 text-white text-xl font-black rounded-[24px] shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-all text-center"
                >
                    Re-answer Question
                </Link>
                <Link
                    href="/demo-v2/review/item"
                    className="w-full py-5 bg-gray-100 text-gray-500 text-xl font-black rounded-[24px] hover:bg-gray-200 transition-all text-center"
                >
                    Skip to Next
                </Link>
            </div>
        </div>
    );
}
