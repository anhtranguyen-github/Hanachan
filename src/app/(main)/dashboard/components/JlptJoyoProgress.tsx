'use client';

import React from 'react';
import { Target } from 'lucide-react';

interface ProgressData {
  total: number;
  passed: number;
  burned: number;
}

interface JlptJoyoProgressProps {
  progress: {
    jlpt: Record<number, ProgressData>;
    joyo: Record<number, ProgressData>;
  };
}

export const JlptJoyoProgress: React.FC<JlptJoyoProgressProps> = ({ progress }) => {
  if (!progress) return null;

  const jlptLevels = [5, 4, 3, 2, 1];
  const joyoGrades = [1, 2, 3, 4, 5, 6, 8];

  const ProgressBar = ({ data }: { data: ProgressData }) => {
    const passedPercent = data.total > 0 ? (data.passed / data.total) * 100 : 0;
    const burnedPercent = data.total > 0 ? (data.burned / data.total) * 100 : 0;
    
    return (
      <div className="flex-grow">
        <div className="flex justify-between text-[10px] mb-1 font-bold">
          <span className="text-zinc-400 uppercase">Passed: <span className="text-zinc-700 dark:text-zinc-300">{data.passed}</span></span>
          <span className="text-zinc-400 uppercase">Total: <span className="text-zinc-700 dark:text-zinc-300">{data.total}</span></span>
        </div>
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(236,72,153,0.3)]" 
            style={{ width: `${passedPercent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-bold">Kanji Progress</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* JLPT Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">JLPT Levels</h3>
            <div className="h-[1px] flex-grow bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="space-y-5">
            {jlptLevels.map(level => {
              const data = progress.jlpt[level] || { total: 0, passed: 0, burned: 0 };
              return (
                <div key={level} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500 group-hover:text-pink-500 transition-colors">
                    N{level}
                  </div>
                  <ProgressBar data={data} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Joyo Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Joyo Grades</h3>
            <div className="h-[1px] flex-grow bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="space-y-4">
            {joyoGrades.map(grade => {
              const data = progress.joyo[grade] || { total: 0, passed: 0, burned: 0 };
              return (
                <div key={grade} className="flex items-center gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500 group-hover:text-blue-500 transition-colors">
                    G{grade === 8 ? 'H' : grade}
                  </div>
                  <ProgressBar data={data} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
