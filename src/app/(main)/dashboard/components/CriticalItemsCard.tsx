'use client';

import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CriticalItem {
  subject_id: number;
  percentage_correct: number;
  knowledge_unit: {
    character: string;
    meaning: string;
    type: string;
    level: number;
  };
}

interface CriticalItemsCardProps {
  items: CriticalItem[];
}

export const CriticalItemsCard: React.FC<CriticalItemsCardProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 h-full flex flex-col items-center justify-center text-center opacity-60">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-3">
          <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-lg font-bold mb-1">Looking Good!</h2>
        <p className="text-sm text-zinc-500">No critical condition items found.</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'radical': return 'bg-sky-500';
      case 'kanji': return 'bg-pink-500';
      case 'vocabulary': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold">Critical Condition</h2>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
          Accuracy &lt; 75%
        </span>
      </div>

      <div className="flex-grow space-y-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {items.map((item) => (
          <div 
            key={item.subject_id}
            className="group flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`${getTypeColor(item.knowledge_unit.type)} w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-japanese shadow-sm`}>
                {item.knowledge_unit.character || item.knowledge_unit.meaning[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold truncate max-w-[140px]">
                  {item.knowledge_unit.meaning}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Level {item.knowledge_unit.level} • {item.knowledge_unit.type}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-black text-red-600 dark:text-red-400">
                {item.percentage_correct}%
              </div>
              <div className="text-[10px] text-zinc-400 font-medium lowercase">accuracy</div>
            </div>
          </div>
        ))}
      </div>

      <Link 
        href="/learn/critical" 
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98]"
      >
        View All <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
