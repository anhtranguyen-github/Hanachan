'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { X, BookmarkPlus, BookmarkCheck, ExternalLink } from 'lucide-react';
import { JLPTBadge } from './JLPTBadge';
import type { VideoVocabStat } from '../types';
import { JLPT_COLORS } from '../types';

interface VocabWordCloudProps {
  stats: VideoVocabStat[];
  savedWords?: Set<string>;
  onWordClick?: (stat: VideoVocabStat) => void;
  onSaveWord?: (stat: VideoVocabStat) => void;
  maxWords?: number;
  className?: string;
}

export function VocabWordCloud({
  stats,
  savedWords = new Set(),
  onWordClick,
  onSaveWord,
  maxWords = 60,
  className,
}: VocabWordCloudProps) {
  const [selectedWord, setSelectedWord] = useState<VideoVocabStat | null>(null);
  const [filterJLPT, setFilterJLPT] = useState<number | null>(null);

  const displayStats = useMemo(() => {
    let filtered = stats;
    if (filterJLPT !== null) {
      filtered = stats.filter(s => s.jlpt === filterJLPT);
    }
    return filtered.slice(0, maxWords);
  }, [stats, filterJLPT, maxWords]);

  const maxFreq = useMemo(() => Math.max(...displayStats.map(s => s.frequency), 1), [displayStats]);
  const minFreq = useMemo(() => Math.min(...displayStats.map(s => s.frequency), 1), [displayStats]);

  // Calculate font size based on frequency (log scale)
  const getFontSize = (freq: number) => {
    if (maxFreq === minFreq) return 16;
    const logMin = Math.log(minFreq + 1);
    const logMax = Math.log(maxFreq + 1);
    const logFreq = Math.log(freq + 1);
    const normalized = (logFreq - logMin) / (logMax - logMin);
    return Math.round(10 + normalized * 22); // 10px to 32px
  };

  const getWordColor = (stat: VideoVocabStat) => {
    if (stat.jlpt && JLPT_COLORS[stat.jlpt]) {
      return JLPT_COLORS[stat.jlpt].border;
    }
    return '#CBD5E0';
  };

  // JLPT filter counts
  const jlptCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    stats.forEach(s => {
      if (s.jlpt) counts[s.jlpt] = (counts[s.jlpt] || 0) + 1;
    });
    return counts;
  }, [stats]);

  if (stats.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="text-4xl mb-3">📊</div>
        <p className="text-[#A0AEC0] text-sm font-medium">No vocabulary data available</p>
        <p className="text-[#CBD5E0] text-xs mt-1">Subtitles need to be processed first</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* JLPT Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">Filter:</span>
        <button
          onClick={() => setFilterJLPT(null)}
          className={clsx(
            'text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide transition-all duration-200',
            filterJLPT === null
              ? 'bg-[#3E4A61] text-white'
              : 'bg-[#F7FAFC] text-[#A0AEC0] hover:bg-[#EDF2F7]'
          )}
        >
          All ({stats.length})
        </button>
        {[5, 4, 3, 2, 1].map(level => {
          const count = jlptCounts[level] || 0;
          if (count === 0) return null;
          const colors = JLPT_COLORS[level];
          return (
            <button
              key={level}
              onClick={() => setFilterJLPT(filterJLPT === level ? null : level)}
              className={clsx(
                'text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide border transition-all duration-200',
              )}
              style={{
                backgroundColor: filterJLPT === level ? colors.border : colors.bg,
                color: colors.text,
                borderColor: colors.border,
              }}
            >
              N{level} ({count})
            </button>
          );
        })}
      </div>

      {/* Word Cloud */}
      <div className="relative min-h-[200px] bg-[#F7FAFC] rounded-2xl p-4 flex flex-wrap gap-2 items-center justify-center">
        {displayStats.map((stat) => {
          const fontSize = getFontSize(stat.frequency);
          const color = getWordColor(stat);
          const isSaved = savedWords.has(stat.surface);
          const isSelected = selectedWord?.surface === stat.surface;

          return (
            <button
              key={stat.surface}
              onClick={() => {
                setSelectedWord(isSelected ? null : stat);
                onWordClick?.(stat);
              }}
              className={clsx(
                'jp-text font-bold transition-all duration-200 rounded-lg px-1 py-0.5',
                'hover:scale-110 hover:bg-white hover:shadow-md active:scale-95',
                isSelected && 'bg-white shadow-md scale-110',
                isSaved && 'underline decoration-dotted',
              )}
              style={{
                fontSize: `${fontSize}px`,
                color: isSelected ? color : `${color}CC`,
                lineHeight: 1.2,
              }}
              title={`${stat.surface} — ${stat.frequency}x${stat.meaning ? ` — ${stat.meaning}` : ''}`}
            >
              {stat.surface}
            </button>
          );
        })}
      </div>

      {/* Selected word detail */}
      {selectedWord && (
        <WordDetail
          stat={selectedWord}
          isSaved={savedWords.has(selectedWord.surface)}
          onClose={() => setSelectedWord(null)}
          onSave={() => onSaveWord?.(selectedWord)}
        />
      )}

      {/* Legend */}
      <div className="flex items-center justify-between text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">
        <span>Word size = frequency</span>
        <div className="flex items-center gap-3">
          {[5, 4, 3, 2, 1].map(level => {
            if (!jlptCounts[level]) return null;
            const colors = JLPT_COLORS[level];
            return (
              <div key={level} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.border }} />
                <span style={{ color: colors.text }}>N{level}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// WORD DETAIL PANEL
// ==========================================

interface WordDetailProps {
  stat: VideoVocabStat;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
}

function WordDetail({ stat, isSaved, onClose, onSave }: WordDetailProps) {
  const colors = stat.jlpt ? JLPT_COLORS[stat.jlpt] : null;

  return (
    <div
      className="glass-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={colors ? { borderColor: `${colors.border}40` } : {}}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-black text-[#3E4A61] jp-text">{stat.surface}</span>
          {stat.reading && stat.reading !== stat.surface && (
            <span className="text-[#A0AEC0] text-sm jp-text">({stat.reading})</span>
          )}
          {stat.jlpt && <JLPTBadge level={stat.jlpt} size="sm" />}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-[#CBD5E0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {stat.meaning && (
        <p className="text-[#3E4A61] text-sm leading-relaxed">{stat.meaning}</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7FAFC] rounded-xl">
          <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">Frequency</span>
          <span className="text-[11px] font-black text-[#3E4A61]">{stat.frequency}×</span>
        </div>

        <button
          onClick={onSave}
          disabled={isSaved}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all duration-200',
            isSaved
              ? 'bg-primary/10 text-primary cursor-default'
              : 'bg-[#F7FAFC] text-[#A0AEC0] hover:bg-primary/10 hover:text-primary'
          )}
        >
          {isSaved ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
          {isSaved ? 'Saved' : 'Save'}
        </button>

        {stat.ku_id && (
          <a
            href={`/content/vocabulary/${stat.ku_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide bg-[#F7FAFC] text-[#A0AEC0] hover:text-[#3E4A61] transition-all"
          >
            <ExternalLink size={12} />
            Details
          </a>
        )}
      </div>
    </div>
  );
}

// ==========================================
// FREQUENCY TABLE VIEW
// ==========================================

interface VocabFrequencyTableProps {
  stats: VideoVocabStat[];
  savedWords?: Set<string>;
  onSaveWord?: (stat: VideoVocabStat) => void;
  className?: string;
}

export function VocabFrequencyTable({
  stats,
  savedWords = new Set(),
  onSaveWord,
  className,
}: VocabFrequencyTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayStats = showAll ? stats : stats.slice(0, 20);

  if (stats.length === 0) return null;

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="space-y-1">
        {displayStats.map((stat, idx) => {
          const colors = stat.jlpt ? JLPT_COLORS[stat.jlpt] : null;
          const isSaved = savedWords.has(stat.surface);
          const maxFreq = stats[0]?.frequency || 1;
          const barPct = Math.round((stat.frequency / maxFreq) * 100);

          return (
            <div
              key={stat.surface}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F7FAFC] transition-colors group"
            >
              <span className="text-[9px] font-black text-[#CBD5E0] w-5 text-right shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm font-black text-[#3E4A61] jp-text w-16 shrink-0">
                {stat.surface}
              </span>
              {stat.reading && (
                <span className="text-[10px] text-[#A0AEC0] jp-text w-16 shrink-0 truncate">
                  {stat.reading}
                </span>
              )}
              <div className="flex-1 h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: colors?.border || '#CBD5E0',
                  }}
                />
              </div>
              <span className="text-[9px] font-black text-[#A0AEC0] w-8 text-right shrink-0">
                {stat.frequency}×
              </span>
              {stat.jlpt && <JLPTBadge level={stat.jlpt} size="xs" className="shrink-0" />}
              <button
                onClick={() => onSaveWord?.(stat)}
                disabled={isSaved}
                className={clsx(
                  'w-6 h-6 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0',
                  isSaved ? 'text-primary opacity-100' : 'text-[#CBD5E0] hover:text-primary'
                )}
              >
                {isSaved ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
              </button>
            </div>
          );
        })}
      </div>

      {stats.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-[10px] font-black text-[#A0AEC0] hover:text-primary uppercase tracking-widest transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${stats.length} Words`}
        </button>
      )}
    </div>
  );
}
