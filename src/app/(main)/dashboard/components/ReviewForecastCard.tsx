'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface ReviewForecastCardProps {
  forecast: Record<string, number>;
  type: 'hourly' | 'daily';
}

export const ReviewForecastCard: React.FC<ReviewForecastCardProps> = ({ forecast, type }) => {
  if (!forecast) return null;

  const now = new Date();
  const displayData: { label: string, count: number }[] = [];

  if (type === 'hourly') {
    for (let i = 0; i < 24; i++) {
      const d = new Date(now);
      d.setHours(d.getHours() + i, 0, 0, 0);
      const iso = d.toISOString();
      displayData.push({
        label: `${d.getHours()}:00`,
        count: forecast[iso] || 0
      });
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString(undefined, { weekday: 'short' });
      
      // Calculate daily sum
      let dailySum = 0;
      Object.entries(forecast).forEach(([iso, count]) => {
        const itemDate = new Date(iso);
        if (itemDate.toDateString() === d.toDateString()) {
          dailySum += count;
        }
      });
      
      displayData.push({
        label: i === 0 ? 'Today' : dateStr,
        count: dailySum
      });
    }
  }

  const maxCount = Math.max(...displayData.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold">Review Forecast</h2>
        </div>
      </div>

      <div className="flex-grow flex items-end gap-1 min-h-[160px] mb-2 px-1">
        {displayData.map((d, i) => (
          <div key={i} className="flex-grow flex flex-col items-center group">
            <div className="relative w-full flex justify-center items-end h-32">
              <div 
                className="w-full max-w-[12px] bg-zinc-50 dark:bg-zinc-800/50 rounded-full overflow-hidden transition-all duration-300 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800"
                style={{ height: '100%' }}
              >
                <div 
                  className="w-full bg-gradient-to-t from-indigo-600 via-purple-500 to-fuchsia-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 translate-y-1 group-hover:translate-y-0">
                <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] py-1.5 px-2.5 rounded-xl font-black whitespace-nowrap shadow-xl border border-white/10 dark:border-black/5 flex flex-col items-center">
                  <span>{d.count}</span>
                  <span className="text-[8px] opacity-60 uppercase tracking-tighter">reviews</span>
                </div>
                {/* Tooltip arrow */}
                <div className="w-2 h-2 bg-zinc-900 dark:bg-white rotate-45 mx-auto -mt-1 border-r border-b border-white/10 dark:border-black/5" />
              </div>
            </div>
            {/* Show labels selectively for cleaner look if many bars */}
            {(type === 'daily' || i % 4 === 0) && (
              <span className="text-[8px] font-black text-zinc-400 mt-3 uppercase tracking-tighter">
                {d.label}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] pt-4 border-t border-zinc-50 dark:border-zinc-800">
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          Timeline
        </span>
        <span>{type === 'hourly' ? 'Next 24 Hours' : 'Next 7 Days'}</span>
      </div>
    </div>
  );
};
