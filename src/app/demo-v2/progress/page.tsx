import React from 'react';
import Link from 'next/link';

export default function Academy() {
    return (
        <div className="space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Academy Journey</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Analytical insights into your progress</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* SRS Level Card */}
                <div className="lg:col-span-2 bg-white border-2 border-gray-300 p-10 rounded-[56px] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px]"></div>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-gray-900 leading-none">Level 12</h3>
                            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Pleasant Stage</span>
                        </div>
                        <span className="text-xl font-black text-primary italic underline decoration-4 underline-offset-8">80% to Lvl 13</span>
                    </div>
                    <div className="h-6 bg-gray-50 rounded-2xl p-1 border border-gray-100 mb-6">
                        <div className="w-[80%] h-full bg-primary rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Stability", val: "84%", color: "text-green-500" },
                            { label: "Difficulty", val: "Lo", color: "text-blue-500" },
                            { label: "Burned", val: "128", color: "text-orange-500" }
                        ].map((s, i) => (
                            <div key={i} className="bg-gray-50/50 p-4 rounded-3xl text-center">
                                <span className="block text-[8px] font-black uppercase text-gray-400 tracking-widest">{s.label}</span>
                                <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Accuracy Card - from LearningLog Integration */}
                <div className="bg-gray-900 text-white p-10 rounded-[56px] shadow-2xl space-y-8 flex flex-col justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Global Precision</h3>
                    <div className="space-y-2">
                        <span className="block text-7xl font-black bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent italic">92%</span>
                        <p className="text-xs font-bold text-gray-400">Your accuracy has increased by 4% this month.</p>
                    </div>
                    <div className="flex gap-2 items-end h-16">
                        {[40, 60, 45, 80, 70, 90, 85].map((h, i) => (
                            <div key={i} className="flex-1 bg-white/10 rounded-t-lg relative group transition-all hover:bg-primary">
                                <div style={{ height: `${h}%` }} className="absolute bottom-0 left-0 right-0 bg-white/20 rounded-t-lg group-hover:bg-white/40"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Precision Heatmap Mockup - reflecting Daily Counts */}
            <section className="bg-white border-2 border-gray-300 p-10 rounded-[56px] shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Daily Learning Log (Past 3 Months)</h3>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map(v => (
                            <div key={v} className={`w-3 h-3 rounded-sm ${v === 0 ? 'bg-gray-50' : v === 1 ? 'bg-primary/20' : v === 2 ? 'bg-primary/50' : 'bg-primary'}`}></div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5 opacity-80">
                    {Array.from({ length: 90 }).map((_, i) => {
                        const val = Math.random() * 4;
                        return (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-md transition-colors hover:scale-125 ${val < 1 ? 'bg-gray-50' : val < 2 ? 'bg-primary/20' : val < 3 ? 'bg-primary/50' : 'bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.2)]'}`}
                                title={`Activity: ${Math.floor(val * 10)} items`}
                            ></div>
                        );
                    })}
                </div>
            </section>

            <section className="bg-kanji text-white p-12 rounded-[56px] shadow-xl relative overflow-hidden group">
                <div className="relative z-10 space-y-6 max-w-lg">
                    <h2 className="text-4xl font-black leading-tight">Mastering Level 12</h2>
                    <p className="text-white/70 font-bold leading-relaxed">
                        You have passed <span className="text-white underline decoration-4 underline-offset-4">24 of 30</span> Kanji required to reach Level 13. Focus on "Sun" (日) and "Moon" (月) to hit your next target.
                    </p>
                    <button className="px-12 py-5 bg-white text-kanji font-black rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all">Go to Level Details →</button>
                </div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
            </section>
        </div>
    );
}
