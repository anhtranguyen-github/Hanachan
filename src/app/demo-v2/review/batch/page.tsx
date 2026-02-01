import React from 'react';
import Link from 'next/link';

export default function ReviewBatch() {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="w-20 h-20 border-8 border-kanji/20 border-t-kanji rounded-full animate-spin"></div>
            <p className="text-kanji font-black uppercase tracking-widest animate-pulse">Loading Session...</p>
            <Link href="/demo-v2/review/radical" className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">
                Click to skip loading
            </Link>
        </div>
    );
}
