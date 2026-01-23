import React from 'react';
import Link from 'next/link';

export default function LearnNextItem() {
    return (
        <div className="h-full flex flex-col max-w-2xl mx-auto space-y-6 py-10">
            <header className="text-center space-y-2">
                <h1 className="text-2xl font-black text-gray-900">Check Point</h1>
                <p className="text-gray-400">Recall the meaning of the items you just learned.</p>
            </header>

            <div className="bg-white border-2 border-gray-100 p-12 rounded-[48px] shadow-sm space-y-10">
                <div className="text-center">
                    <span className="text-8xl font-black text-gray-800">一</span>
                </div>

                <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-primary text-center">Meaning</label>
                    <input
                        type="text"
                        placeholder="Type answer..."
                        className="w-full py-6 bg-gray-50 border-2 border-transparent focus:border-primary rounded-3xl text-center text-3xl font-black transition-all outline-none"
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <Link
                        href="/demo-v2/learn/lesson-batch/complete"
                        className="block w-full py-5 bg-primary text-white text-xl font-black rounded-3xl shadow-lg hover:scale-[1.02] transition-all text-center"
                    >
                        Check Answer (Correct)
                    </Link>
                    <Link
                        href="/demo-v2/learn/lesson-batch/incorrect"
                        className="block w-full py-4 bg-gray-50 text-gray-400 text-sm font-black rounded-2xl hover:bg-gray-100 transition-all text-center border-2 border-dashed border-gray-200"
                    >
                        Simulate Incorrect Answer
                    </Link>
                </div>
            </div>

            <div className="text-center">
                <Link href="/demo-v2/learn/quit" className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">
                    I want to quit
                </Link>
            </div>
        </div>
    );
}
