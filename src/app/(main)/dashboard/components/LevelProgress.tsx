'use client';

import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LevelProgressProps {
    progress: {
        radicals: { passed: number; total: number };
        kanji: { passed: number; total: number };
        level: number;
    };
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ progress }) => {
    const radicalPct = Math.round((progress.radicals.passed / Math.max(progress.radicals.total, 1)) * 100);
    const kanjiPct = Math.round((progress.kanji.passed / Math.max(progress.kanji.total, 1)) * 100);

    return (
        <div className="glass-card p-6 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] -mr-8 -mt-8">
                <Target size={180} />
            </div>
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#3E4A61] tracking-tight">Level {progress.level} Progress</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0] mt-1">Milestones to Level {progress.level + 1}</p>
                </div>
                <div className="px-3 py-1 bg-primary/10 rounded-full">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Ongoing</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Radicals */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-sky-500/80">Radicals</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-[#3E4A61]">{progress.radicals.passed}</span>
                                <span className="text-sm font-bold text-[#CBD5E0]">/ {progress.radicals.total}</span>
                            </div>
                        </div>
                        <div className="text-right">
                           <span className={clsx("text-xs font-black", radicalPct === 100 ? "text-green-500" : "text-sky-500")}>
                               {radicalPct}%
                           </span>
                        </div>
                    </div>
                    <div className="h-3 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10 p-0.5">
                        <div 
                            className="h-full bg-sky-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(14,165,233,0.3)]"
                            style={{ width: `${radicalPct}%` }}
                        />
                    </div>
                </div>

                {/* Kanji */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-500/80">Kanji</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-[#3E4A61]">{progress.kanji.passed}</span>
                                <span className="text-sm font-bold text-[#CBD5E0]">/ {progress.kanji.total}</span>
                            </div>
                        </div>
                        <div className="text-right">
                           <span className={clsx("text-xs font-black", kanjiPct >= 90 ? "text-green-500" : "text-pink-500")}>
                               {kanjiPct}%
                           </span>
                        </div>
                    </div>
                    <div className="h-3 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10 p-0.5">
                        <div 
                            className="h-full bg-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                            style={{ width: `${kanjiPct}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest relative z-10 pt-2 border-t border-zinc-50">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>Guru or higher required to pass milestones</span>
            </div>
        </div>
    );
};
