'use client';

import React from 'react';
import Link from 'next/link';

export default function LearnQuit() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="bg-white border border-gray-300 p-12 rounded-[40px] shadow-2xl max-w-md w-full text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-gray-900">Quitting so soon?</h1>
                    <p className="text-gray-500 font-medium">Your progress for this batch will be lost if you leave now.</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => window.history.back()}
                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-md hover:bg-primary-dark transition-all"
                    >
                        No, Keep Learning
                    </button>
                    <Link
                        href="/demo-v2/learn"
                        className="block w-full py-4 bg-gray-50 text-gray-400 font-black rounded-2xl border border-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        Yes, Quit
                    </Link>
                </div>
            </div>
        </div>
    );
}
