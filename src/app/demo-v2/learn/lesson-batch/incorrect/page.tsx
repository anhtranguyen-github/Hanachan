import React from 'react';
import Link from 'next/link';

export default function LessonIncorrect() {
    return (
        <div className="h-full flex flex-col items-center justify-center space-y-10 py-10">
            <div className="bg-white border-4 border-orange-400 p-12 rounded-[56px] text-center shadow-2xl shadow-orange-500/10 space-y-8 max-w-sm w-full">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-orange-500 tracking-tighter">Not Quite</h1>
                    <p className="text-sm font-bold text-gray-400">Let's try that one again.</p>
                </div>

                <div className="bg-orange-50 p-6 rounded-3xl space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">The Answer was</p>
                    <p className="text-4xl font-black text-orange-600">Ground</p>
                </div>

                <div className="text-5xl">🤔</div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
                <Link
                    href="/demo-v2/learn/lesson-batch/next"
                    className="w-full py-5 bg-orange-500 text-white text-xl font-black rounded-[24px] shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all text-center"
                >
                    Retry Question
                </Link>
                <Link
                    href="/demo-v2/learn/lesson-batch"
                    className="w-full py-5 bg-gray-100 text-gray-500 text-xl font-black rounded-[24px] hover:bg-gray-200 transition-all text-center"
                >
                    Review Lesson Material
                </Link>
            </div>
        </div>
    );
}
