import React from 'react';
import Link from 'next/link';

export default function LearnEntry() {
    return (
        <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-black text-gray-900">Start Learning</h1>
                <p className="text-gray-500">You have 42 items ready to learn today.</p>
            </div>

            <div className="bg-white border-2 border-primary/40 p-10 rounded-[40px] shadow-xl text-center space-y-8">
                <div className="flex justify-center gap-4">
                    <div className="w-16 h-16 bg-radical/10 rounded-2xl flex items-center justify-center text-radical font-bold">Radical</div>
                    <div className="w-16 h-16 bg-kanji/10 rounded-2xl flex items-center justify-center text-kanji font-bold">Kanji</div>
                    <div className="w-16 h-16 bg-vocab/10 rounded-2xl flex items-center justify-center text-vocab font-bold">Vocab</div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">New Batch: 5 Items</h2>
                    <p className="text-sm text-gray-400 font-medium">Approx. time: 10 minutes</p>
                </div>

                <Link
                    href="/demo-v2/learn/lesson-batch"
                    className="block w-full py-5 bg-primary text-white text-xl font-black rounded-3xl shadow-lg hover:translate-y-[-2px] transition-all"
                >
                    Begin Session
                </Link>
            </div>

            <div className="text-center">
                <Link href="/demo-v2/dashboard" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
