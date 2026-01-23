import React from 'react';
import Link from 'next/link';

export default function LearnComplete() {
    return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-12">
            <div className="space-y-4">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                    🎉
                </div>
                <h1 className="text-4xl font-black text-gray-900">Session Complete!</h1>
                <p className="text-gray-500">You've mastered 5 new Knowledge Units.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-300 p-6 rounded-3xl shadow-sm">
                    <span className="block text-2xl font-black text-primary">5</span>
                    <span className="text-xs font-bold uppercase text-gray-400">Items Learned</span>
                </div>
                <div className="bg-white border border-gray-300 p-6 rounded-3xl shadow-sm">
                    <span className="block text-2xl font-black text-kanji">100%</span>
                    <span className="text-xs font-bold uppercase text-gray-400">Accuracy</span>
                </div>
            </div>

            <div className="space-y-3">
                <Link
                    href="/demo-v2/learn"
                    className="block w-full py-5 bg-primary text-white text-xl font-black rounded-3xl shadow-lg hover:translate-y-[-2px] transition-all"
                >
                    Learn More
                </Link>
                <Link
                    href="/demo-v2/dashboard"
                    className="block w-full py-5 bg-white text-gray-700 text-xl font-black rounded-3xl border-2 border-gray-300 shadow-sm hover:bg-gray-50 transition-all"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
