'use client';

import React from 'react';

interface SRSDetail {
  radical: number;
  kanji: number;
  vocabulary: number;
  total: number;
}

interface DetailedSrsSpreadProps {
  detailed: {
    apprentice1: SRSDetail;
    apprentice2: SRSDetail;
    apprentice3: SRSDetail;
    apprentice4: SRSDetail;
    guru1: SRSDetail;
    guru2: SRSDetail;
    master: SRSDetail;
    enlightened: SRSDetail;
    burned: SRSDetail;
  };
}

export const DetailedSrsSpread: React.FC<DetailedSrsSpreadProps> = ({ detailed }) => {
  const rows = [
    { label: 'Apprentice I', data: detailed.apprentice1, color: '#FF7EB9' },
    { label: 'Apprentice II', data: detailed.apprentice2, color: '#FF7EB9' },
    { label: 'Apprentice III', data: detailed.apprentice3, color: '#FF7EB9' },
    { label: 'Apprentice IV', data: detailed.apprentice4, color: '#FF7EB9' },
    { label: 'Guru I', data: detailed.guru1, color: '#B197FC' },
    { label: 'Guru II', data: detailed.guru2, color: '#B197FC' },
    { label: 'Master', data: detailed.master, color: '#4DABF7' },
    { label: 'Enlightened', data: detailed.enlightened, color: '#91A7FF' },
    { label: 'Burned', data: detailed.burned, color: '#868E96' },
  ];

  return (
    <div className="glass-card p-6 space-y-4 h-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#3E4A61] tracking-tight">SRS Breakdown</h3>
          <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Item distribution by stage and type</p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 sm:mx-0 no-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-1.5 px-6 sm:px-0">
          <thead>
            <tr>
              <th className="text-[9px] font-black uppercase tracking-widest text-zinc-400 pb-2 px-3">Stage</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-sky-500 pb-2 text-center">Rad</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-pink-500 pb-2 text-center">Kan</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-purple-500 pb-2 text-center">Voc</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-zinc-500 pb-2 text-right px-4">Tot</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="group">
                <td className="py-2 px-3 rounded-l-xl bg-zinc-50/50 dark:bg-zinc-800/30 border-y border-l border-zinc-100 dark:border-zinc-800 transition-all duration-300 group-hover:bg-white dark:group-hover:bg-zinc-800 shadow-sm group-hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="text-[11px] font-black text-[#3E4A61] dark:text-zinc-300 whitespace-nowrap">{row.label}</span>
                  </div>
                </td>
                <td className="py-2 bg-zinc-50/50 dark:bg-zinc-800/30 border-y border-zinc-100 dark:border-zinc-800 text-center text-[10px] font-bold text-zinc-500 group-hover:bg-white dark:group-hover:bg-zinc-800">
                  {row.data.radical || '-'}
                </td>
                <td className="py-2 bg-zinc-50/50 dark:bg-zinc-800/30 border-y border-zinc-100 dark:border-zinc-800 text-center text-[10px] font-bold text-zinc-500 group-hover:bg-white dark:group-hover:bg-zinc-800">
                  {row.data.kanji || '-'}
                </td>
                <td className="py-2 bg-zinc-50/50 dark:bg-zinc-800/30 border-y border-zinc-100 dark:border-zinc-800 text-center text-[10px] font-bold text-zinc-500 group-hover:bg-white dark:group-hover:bg-zinc-800">
                  {row.data.vocabulary || '-'}
                </td>
                <td className="py-2 px-4 rounded-r-xl bg-zinc-50/50 dark:bg-zinc-800/30 border-y border-r border-zinc-100 dark:border-zinc-800 text-right text-[11px] font-black text-[#3E4A61] dark:text-zinc-200 group-hover:bg-white dark:group-hover:bg-zinc-800">
                  {row.data.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
