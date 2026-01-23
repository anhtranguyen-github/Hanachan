import React from 'react';
import Link from 'next/link';

export default function ReviewSummary() {
    return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-16">
            <div className="space-y-4">
                <h1 className="text-5xl font-black text-gray-900">Excellent Work!</h1>
                <p className="text-gray-500">10 items reviewed. Everything is up to date.</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                 {[
                    { label: 'Accuracy', val: '80%' },
                    { label: 'Longest Streak', val: '6' },
                    { label: 'Next Due', val: '2h' }
                 ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-300 p-6 rounded-3xl">
                        <span className="block text-2xl font-black text-kanji">{s.val}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400">{s.label}</span>
                    </div>
                 ))}
            </div>

            <Link 
                href="/demo-v2/dashboard"
                className="block w-full py-6 bg-primary text-white text-2xl font-black rounded-3xl shadow-xl hover:translate-y-[-4px] transition-all"
            >
                Return to Dashboard
            </Link>
        </div>
    );
}
