import React from 'react';
import Link from 'next/link';

export default function ReviewCloze() {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center px-4">
                <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-grammar">45 / 115</span>
                    <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="w-[40%] h-full bg-grammar"></div>
                    </div>
                </div>
                <Link href="/demo-v2/review" className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors">
                    End Session
                </Link>
            </header>

            <div className="flex-1 bg-white border-2 border-gray-300 rounded-[48px] shadow-sm flex flex-col overflow-hidden">
                <div className="bg-grammar p-16 text-center text-white">
                    <p className="text-4xl md:text-5xl font-black leading-relaxed">
                        私は学生 <span className="inline-block border-b-4 border-white px-2 min-w-[80px]">?</span>。
                    </p>
                </div>

                <div className="flex-1 p-12 space-y-12">
                    <div className="space-y-4 text-center">
                        <input
                            type="text"
                            placeholder="Type the answer..."
                            className="w-full py-8 bg-gray-50 border-b-4 border-grammar/30 focus:border-grammar rounded-t-3xl text-center text-4xl font-black transition-all outline-none"
                            autoFocus
                        />
                        <p className="text-gray-500 font-bold">I am a student.</p>
                    </div>

                    <div className="flex justify-center">
                        <button className="px-12 py-4 bg-secondary text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all">
                            Submit
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-center gap-12">
                    <span className="font-black text-grammar uppercase text-xs tracking-widest">🔥 12 Streak</span>
                    <span className="font-black text-gray-700 uppercase text-xs tracking-widest">Apprentice IV</span>
                </div>
            </div>
        </div>
    );
}
