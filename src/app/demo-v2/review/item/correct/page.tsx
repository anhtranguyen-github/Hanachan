import React from 'react';
import Link from 'next/link';

export default function ReviewCorrect() {
    return (
        <div className="h-full flex flex-col items-center justify-center space-y-10">
            <div className="bg-green-500 p-12 rounded-[48px] text-white text-center shadow-2xl space-y-4 max-w-sm w-full">
                <h1 className="text-4xl font-black">Correct!</h1>
                <p className="text-xl font-medium">みず (mizu)</p>
                <div className="text-6xl pt-4">✨</div>
            </div>

            <Link 
                href="/demo-v2/review/item"
                className="px-12 py-5 bg-gray-900 text-white text-xl font-black rounded-3xl shadow-lg hover:scale-105 transition-all"
            >
                Next Item
            </Link>
            
            <Link href="/demo-v2/review/complete" className="text-gray-400 font-bold underline underline-offset-4">
                Finish Session
            </Link>
        </div>
    );
}
