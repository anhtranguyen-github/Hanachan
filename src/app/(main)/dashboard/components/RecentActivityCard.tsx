'use client';

import React from 'react';
import { History, Zap, Flame } from 'lucide-react';

interface ActivityItem {
  unlocked_at?: string;
  burned_at?: string;
  knowledge_unit: {
    character: string;
    meaning: string;
    type: string;
    level: number;
  };
}

interface RecentActivityCardProps {
  unlocked: ActivityItem[];
  burned: ActivityItem[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ unlocked, burned }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'radical': return 'bg-sky-500';
      case 'kanji': return 'bg-pink-500';
      case 'vocabulary': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const ActivityList = ({ title, items, icon: Icon, colorClass }: { title: string, items: ActivityItem[], icon: any, colorClass: string }) => (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{title}</h3>
      </div>
      
      {items.length === 0 ? (
        <div className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 border-dashed text-center text-xs text-zinc-400 font-bold">
          No activity in last 30d
        </div>
      ) : (
        <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-2">
          {items.map((item, i) => (
            <div 
              key={i}
              className={`group relative ${getTypeColor(item.knowledge_unit.type)} p-1 rounded-xl text-white font-japanese shadow-sm hover:scale-110 transition-all cursor-default aspect-square flex items-center justify-center text-base sm:text-lg`}
            >
              {item.knowledge_unit.character || item.knowledge_unit.meaning[0]}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 translate-y-1 group-hover:translate-y-0">
                <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] py-1.5 px-2 rounded-lg font-black whitespace-nowrap shadow-xl border border-white/10 dark:border-black/5">
                  {item.knowledge_unit.meaning}
                </div>
                <div className="w-2 h-2 bg-zinc-900 dark:bg-white rotate-45 mx-auto -mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <History className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <h2 className="text-lg font-bold">Recent History</h2>
      </div>

      <div className="flex flex-col xlg:flex-row gap-8">
        <ActivityList 
          title="Recently Unlocked" 
          items={unlocked} 
          icon={Zap} 
          colorClass="bg-amber-400 shadow-amber-200/50"
        />
        <div className="w-px bg-zinc-100 dark:bg-zinc-800 hidden xlg:block" />
        <ActivityList 
          title="Recently Burned" 
          items={burned} 
          icon={Flame} 
          colorClass="bg-zinc-800 dark:bg-zinc-700 shadow-zinc-200/50"
        />
      </div>
    </div>
  );
};
