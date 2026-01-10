
import React from 'react';
import Link from 'next/link';

export default function KnowledgePage() {
    return (
        <div className="p-10 text-center space-y-4">
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <p className="text-slate-500">Browse Kanji, Vocabulary, and Grammar (Mock).</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
                {['Kanji', 'Vocabulary', 'Grammar'].map(item => (
                    <div key={item} className="p-6 border rounded-xl hover:shadow-md cursor-not-allowed opacity-60 bg-slate-50">
                        <h3 className="font-bold">{item}</h3>
                        <p className="text-sm">Coming Soon</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
