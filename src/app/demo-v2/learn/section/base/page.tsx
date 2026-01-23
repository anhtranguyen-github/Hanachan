import React from 'react';

export default function BaseSection() {
    return (
        <div className="space-y-10">
            <header className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary rounded-3xl shadow-lg"></div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900">Base Section</h1>
                    <p className="text-gray-500 font-medium">Core concepts and introductory materials.</p>
                </div>
            </header>

            <div className="grid gap-4">
                {[1, 2, 3, 4, 5].map((lvl) => (
                    <div key={lvl} className="bg-white border border-gray-300 p-6 rounded-3xl flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-6">
                            <span className="text-2xl font-black text-gray-200">#{lvl}</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Introduction to Particles</h3>
                                <p className="text-sm text-gray-400">5 items • 15 minutes</p>
                            </div>
                        </div>
                        <button className="px-6 py-2 bg-primary text-white font-bold rounded-xl text-sm shadow-sm">Start</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
