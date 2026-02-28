'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { BookmarkPlus, BookmarkCheck, X, ExternalLink, Volume2 } from 'lucide-react';
import { JLPTBadge } from './JLPTBadge';
import type { VideoSubtitle, SubtitleToken, GrammarPoint, WordLookupResult } from '../types';
import { JLPT_COLORS } from '../types';

interface InteractiveSubtitlesProps {
  subtitles: VideoSubtitle[];
  currentTimeMs: number;
  showGrammar?: boolean;
  onWordClick?: (word: string, timestamp: number) => void;
  onSaveWord?: (word: WordLookupResult, timestamp: number) => void;
  onBookmarkGrammar?: (kuId: string, context: string, timestamp: number) => void;
  userId?: string;
  videoId?: string;
  className?: string;
}

interface WordTooltipState {
  word: string;
  timestamp: number;
  result: WordLookupResult | null;
  loading: boolean;
  position: { x: number; y: number };
}

// Cache for word lookups to avoid repeated API calls
const lookupCache = new Map<string, WordLookupResult | null>();

export function InteractiveSubtitles({
  subtitles,
  currentTimeMs,
  showGrammar = true,
  onWordClick,
  onSaveWord,
  onBookmarkGrammar,
  userId,
  videoId,
  className,
}: InteractiveSubtitlesProps) {
  const [tooltip, setTooltip] = useState<WordTooltipState | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const tooltipRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Find current subtitle based on playback time
  const currentSubtitle = subtitles.find(
    s => currentTimeMs >= s.start_time_ms && currentTimeMs <= s.end_time_ms
  );

  // Close tooltip on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleWordClick = useCallback(async (
    token: SubtitleToken,
    timestamp: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    // Debounce rapid clicks
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const word = token.surface;
    onWordClick?.(word, timestamp);

    // Get click position for tooltip
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top,
    };

    // Show loading state
    setTooltip({
      word,
      timestamp,
      result: null,
      loading: true,
      position,
    });

    debounceRef.current = setTimeout(async () => {
      // Check cache first
      if (lookupCache.has(word)) {
        const cached = lookupCache.get(word)!;
        setTooltip(prev => prev?.word === word ? {
          ...prev,
          result: cached,
          loading: false,
        } : prev);
        return;
      }

      try {
        const res = await fetch(`/api/videos/lookup?word=${encodeURIComponent(word)}`, {
          headers: userId ? { 'Authorization': `Bearer ${await getToken()}` } : {},
        });
        const data = await res.json();
        const result = data.result;

        lookupCache.set(word, result);
        setTooltip(prev => prev?.word === word ? {
          ...prev,
          result,
          loading: false,
        } : prev);
      } catch (err) {
        setTooltip(prev => prev?.word === word ? {
          ...prev,
          loading: false,
        } : prev);
      }
    }, 150);
  }, [onWordClick, userId]);

  const handleSaveWord = useCallback(async () => {
    if (!tooltip?.result || !onSaveWord) return;

    onSaveWord(tooltip.result, tooltip.timestamp);
    setSavedWords(prev => new Set(Array.from(prev).concat(tooltip.result!.surface)));

    // Update tooltip state
    setTooltip(prev => prev ? {
      ...prev,
      result: prev.result ? { ...prev.result, is_saved: true } : null,
    } : null);
  }, [tooltip, onSaveWord]);

  if (!currentSubtitle) {
    return (
      <div className={clsx('flex items-center justify-center py-4', className)}>
        <p className="text-[#CBD5E0] text-sm font-medium">—</p>
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      {/* Subtitle text with clickable tokens */}
      <div className="text-center px-4 py-3">
        <SubtitleLine
          subtitle={currentSubtitle}
          showGrammar={showGrammar}
          savedWords={savedWords}
          onWordClick={handleWordClick}
        />
      </div>

      {/* Word lookup tooltip */}
      {tooltip && (
        <WordTooltip
          ref={tooltipRef}
          tooltip={tooltip}
          onClose={() => setTooltip(null)}
          onSave={handleSaveWord}
          onBookmarkGrammar={onBookmarkGrammar}
          currentSubtitleText={currentSubtitle.text}
        />
      )}
    </div>
  );
}

// ==========================================
// SUBTITLE LINE RENDERER
// ==========================================

interface SubtitleLineProps {
  subtitle: VideoSubtitle;
  showGrammar: boolean;
  savedWords: Set<string>;
  onWordClick: (token: SubtitleToken, timestamp: number, event: React.MouseEvent) => void;
}

function SubtitleLine({ subtitle, showGrammar, savedWords, onWordClick }: SubtitleLineProps) {
  const tokens = subtitle.tokens || [];
  const grammarPoints = subtitle.grammar_points || [];

  if (tokens.length === 0) {
    // Fallback: render raw text
    return (
      <p className="text-white text-lg font-medium leading-relaxed jp-text drop-shadow-lg">
        {subtitle.text}
      </p>
    );
  }

  return (
    <p className="text-white text-lg font-medium leading-relaxed jp-text drop-shadow-lg flex flex-wrap justify-center gap-0.5">
      {tokens.map((token, idx) => {
        const isGrammar = showGrammar && grammarPoints.some(
          gp => idx >= (gp.start_char || 0) && idx < (gp.end_char || 0)
        );
        const isSaved = savedWords.has(token.surface);
        const hasJLPT = !!token.jlpt;
        const jlptColors = token.jlpt ? JLPT_COLORS[token.jlpt] : null;

        return (
          <span
            key={idx}
            onClick={(e) => onWordClick(token, subtitle.start_time_ms, e)}
            className={clsx(
              'cursor-pointer rounded px-0.5 transition-all duration-150 select-none',
              'hover:bg-white/20 active:bg-white/30',
              isGrammar && 'underline decoration-dotted decoration-yellow-300 underline-offset-2',
              isSaved && 'text-[#F4ACB7]',
            )}
            style={hasJLPT && jlptColors ? {
              textShadow: `0 0 8px ${jlptColors.border}40`,
            } : {}}
          >
            {token.surface}
          </span>
        );
      })}
    </p>
  );
}

// ==========================================
// WORD TOOLTIP
// ==========================================

interface WordTooltipProps {
  tooltip: WordTooltipState;
  onClose: () => void;
  onSave: () => void;
  onBookmarkGrammar?: (kuId: string, context: string, timestamp: number) => void;
  currentSubtitleText: string;
}

const WordTooltip = React.forwardRef<HTMLDivElement, WordTooltipProps>(
  ({ tooltip, onClose, onSave, onBookmarkGrammar, currentSubtitleText }, ref) => {
    const { word, result, loading } = tooltip;
    const isSaved = result?.is_saved || false;

    return (
      <div
        ref={ref}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 max-w-[90vw]"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
      >
        <div className="bg-[#1A202C]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white text-xl font-black jp-text">{word}</span>
              {result?.reading && result.reading !== word && (
                <span className="text-white/50 text-sm jp-text">({result.reading})</span>
              )}
              {result?.jlpt && <JLPTBadge level={result.jlpt} size="xs" />}
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
              <X size={12} />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <span className="text-white/40 text-xs">Looking up...</span>
              </div>
            ) : result ? (
              <>
                {/* Meaning */}
                {result.meaning && (
                  <p className="text-white/80 text-sm leading-relaxed">{result.meaning}</p>
                )}

                {/* Part of speech */}
                {result.pos && (
                  <span className="inline-block text-[9px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                    {result.pos}
                  </span>
                )}

                {/* Grammar explanation */}
                {result.grammar_explanation && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2">
                    <p className="text-yellow-200/80 text-xs leading-relaxed">{result.grammar_explanation}</p>
                  </div>
                )}

                {/* Example sentences */}
                {result.example_sentences && result.example_sentences.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-white/10">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Example</p>
                    <div className="space-y-0.5">
                      <p className="text-white/70 text-xs jp-text">{result.example_sentences[0].ja}</p>
                      <p className="text-white/40 text-[10px]">{result.example_sentences[0].en}</p>
                    </div>
                  </div>
                )}

                {/* No data fallback */}
                {!result.meaning && !result.grammar_explanation && (
                  <p className="text-white/30 text-xs italic">No definition found</p>
                )}
              </>
            ) : (
              <p className="text-white/30 text-xs italic">Could not load definition</p>
            )}
          </div>

          {/* Actions */}
          {result && (
            <div className="px-3 pb-3 flex items-center gap-2">
              <button
                onClick={onSave}
                disabled={isSaved}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all duration-200',
                  isSaved
                    ? 'bg-primary/20 text-primary cursor-default'
                    : 'bg-white/10 text-white/60 hover:bg-primary/20 hover:text-primary'
                )}
              >
                {isSaved ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
                {isSaved ? 'Saved' : 'Save Word'}
              </button>

              {result.ku_id && (
                <a
                  href={`/content/vocabulary/${result.ku_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-2 overflow-hidden">
          <div className="w-3 h-3 bg-[#1A202C]/95 border border-white/10 rotate-45 -translate-y-1.5 mx-auto" />
        </div>
      </div>
    );
  }
);

WordTooltip.displayName = 'WordTooltip';

// Helper to get auth token (simplified)
async function getToken(): Promise<string> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  } catch {
    return '';
  }
}
