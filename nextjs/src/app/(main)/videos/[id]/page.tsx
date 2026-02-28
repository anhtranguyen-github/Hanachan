'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  BookmarkPlus,
  BookmarkCheck,
  Heart,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  BarChart2,
  BookOpen,
  Cloud,
  List,
  Loader2,
} from 'lucide-react';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { InteractiveSubtitles } from '@/features/video/components/InteractiveSubtitles';
import { JLPTBadge, JLPTChart } from '@/features/video/components/JLPTBadge';
import { VocabWordCloud, VocabFrequencyTable } from '@/features/video/components/VocabWordCloud';
import { DictationPanel } from '@/features/video/components/DictationPractice';
import { useVideoProgress } from '@/features/video/hooks/useVideoProgress';
import * as videoService from '@/features/video/service';
import type { Video, VideoSubtitle, VideoVocabStat, WordLookupResult } from '@/features/video/types';

type SidePanelTab = 'subtitles' | 'jlpt' | 'vocab' | 'grammar';

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();

  const [video, setVideo] = useState<Video | null>(null);
  const [subtitles, setSubtitles] = useState<VideoSubtitle[]>([]);
  const [vocabStats, setVocabStats] = useState<VideoVocabStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showGrammar, setShowGrammar] = useState(true);
  const [activeTab, setActiveTab] = useState<SidePanelTab>('subtitles');
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  const playerRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { progress, updateProgress, saveNow, resumePosition } = useVideoProgress(user?.id, id);

  // Load video data
  useEffect(() => {
    if (!id) return;

    async function loadVideo() {
      try {
        setLoading(true);
        const [videoData, subtitleData, vocabData] = await Promise.all([
          videoService.searchVideos('').then(() => null).catch(() => null), // placeholder
          videoService.getVideoSubtitles(id),
          videoService.getVideoVocabStats(id),
        ]);

        // Load video from DB
        const { data: vid } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!vid) {
          setError('Video not found');
          return;
        }

        setVideo(vid);
        setSubtitles(subtitleData);
        setVocabStats(vocabData);

        // Check library status
        if (user) {
          const inLib = await videoService.isVideoInLibrary(user.id, id);
          setIsInLibrary(inLib);

          // Load saved words
          const words = await videoService.getUserSavedWords(user.id, id);
          setSavedWords(new Set(words.map(w => w.surface)));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, [id, user]);

  // YouTube player time tracking via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          const timeMs = Math.round(data.info.currentTime * 1000);
          setCurrentTimeMs(timeMs);

          if (video && user) {
            const durationMs = (video.duration_seconds || 0) * 1000;
            updateProgress(timeMs, durationMs);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [video, user, updateProgress]);

  const handleAddToLibrary = useCallback(async () => {
    if (!user || !video) return;
    try {
      await videoService.addToLibrary(user.id, { video_id: video.id });
      setIsInLibrary(true);
    } catch (err: any) {
      console.error('Failed to add to library:', err);
    }
  }, [user, video]);

  const handleSaveWord = useCallback(async (result: WordLookupResult, timestamp: number) => {
    if (!user || !video) return;
    try {
      await videoService.saveWord(user.id, {
        surface: result.surface,
        reading: result.reading,
        meaning: result.meaning || undefined,
        jlpt: result.jlpt || undefined,
        ku_id: result.ku_id || undefined,
        source_video_id: video.id,
        source_timestamp_ms: timestamp,
      });
      setSavedWords(prev => new Set(Array.from(prev).concat(result.surface)));
    } catch (err: any) {
      console.error('Failed to save word:', err);
    }
  }, [user, video]);

  const handleSaveVocabWord = useCallback(async (stat: VideoVocabStat) => {
    if (!user || !video) return;
    try {
      await videoService.saveWord(user.id, {
        surface: stat.surface,
        reading: stat.reading || undefined,
        meaning: stat.meaning || undefined,
        jlpt: stat.jlpt || undefined,
        ku_id: stat.ku_id || undefined,
        source_video_id: video.id,
      });
      setSavedWords(prev => new Set(Array.from(prev).concat(stat.surface)));
    } catch (err: any) {
      console.error('Failed to save vocab word:', err);
    }
  }, [user, video]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-[#A0AEC0] text-sm font-medium">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">😕</div>
          <p className="text-[#3E4A61] font-black">{error || 'Video not found'}</p>
          <button
            onClick={() => router.back()}
            className="text-primary text-sm font-bold hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const youtubeEmbedUrl = video.youtube_id
    ? `https://www.youtube.com/embed/${video.youtube_id}?enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&start=${Math.floor(resumePosition / 1000)}`
    : null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-page-entrance">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#A0AEC0] hover:text-[#3E4A61] transition-colors text-sm font-bold"
      >
        <ArrowLeft size={16} />
        Back to Library
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        {/* Left: Video + Subtitles */}
        <div className="space-y-3">
          {/* Video Player */}
          <div className="glass-card overflow-hidden">
            {youtubeEmbedUrl ? (
              <div className="relative aspect-video bg-black">
                <iframe
                  ref={playerRef}
                  src={youtubeEmbedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />

                {/* Subtitle overlay */}
                {showSubtitles && subtitles.length > 0 && (
                  <div className="absolute bottom-12 left-0 right-0 px-4">
                    <InteractiveSubtitles
                      subtitles={subtitles}
                      currentTimeMs={currentTimeMs}
                      showGrammar={showGrammar}
                      onSaveWord={handleSaveWord}
                      userId={user?.id}
                      videoId={video.id}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-[#1A202C] flex items-center justify-center">
                <p className="text-white/40 text-sm">No video source available</p>
              </div>
            )}

            {/* Video controls bar */}
            <div className="p-3 flex items-center justify-between gap-3 border-t border-border/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all duration-200',
                    showSubtitles
                      ? 'bg-primary/10 text-primary'
                      : 'bg-[#F7FAFC] text-[#A0AEC0] hover:text-[#3E4A61]'
                  )}
                >
                  {showSubtitles ? <Eye size={12} /> : <EyeOff size={12} />}
                  Subtitles
                </button>

                {showSubtitles && (
                  <button
                    onClick={() => setShowGrammar(!showGrammar)}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all duration-200',
                      showGrammar
                        ? 'bg-[#B7E4C7]/30 text-[#2D6A4F]'
                        : 'bg-[#F7FAFC] text-[#A0AEC0] hover:text-[#3E4A61]'
                    )}
                  >
                    <BookOpen size={12} />
                    Grammar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Progress indicator */}
                {progress && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-black text-[#A0AEC0]">
                      {progress.progress_percent}%
                    </span>
                  </div>
                )}

                <button
                  onClick={handleAddToLibrary}
                  disabled={isInLibrary}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all duration-200',
                    isInLibrary
                      ? 'bg-primary/10 text-primary cursor-default'
                      : 'bg-[#F7FAFC] text-[#A0AEC0] hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  {isInLibrary ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
                  {isInLibrary ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Dictation Practice Button */}
          {subtitles.length > 0 && (
            <DictationPanel videoId={id} videoTitle={video?.title || ''} />
          )}

          {/* Video info */}
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black text-[#3E4A61] leading-snug">{video.title}</h1>
                {video.channel_name && (
                  <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wide mt-1">
                    {video.channel_name}
                  </p>
                )}
              </div>
              <JLPTBadge level={video.jlpt_level} size="md" showLabel />
            </div>

            {video.description && (
              <p className="text-sm text-[#718096] leading-relaxed line-clamp-3">
                {video.description}
              </p>
            )}

            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[8px] font-black px-2 py-0.5 bg-[#F7FAFC] text-[#A0AEC0] rounded-full uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Side Panel */}
        <div className="space-y-3">
          {/* Tab navigation */}
          <div className="glass-card p-1.5">
            <div className="grid grid-cols-4 gap-1">
              {([
                { id: 'subtitles', icon: BookOpen, label: 'Script' },
                { id: 'jlpt', icon: BarChart2, label: 'JLPT' },
                { id: 'vocab', icon: Cloud, label: 'Words' },
                { id: 'grammar', icon: List, label: 'Grammar' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]'
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="glass-card p-4 min-h-[400px]">
            {activeTab === 'subtitles' && (
              <SubtitleScriptPanel
                subtitles={subtitles}
                currentTimeMs={currentTimeMs}
              />
            )}

            {activeTab === 'jlpt' && (
              <JLPTAnalysisPanel
                video={video}
                subtitles={subtitles}
              />
            )}

            {activeTab === 'vocab' && (
              <VocabPanel
                stats={vocabStats}
                savedWords={savedWords}
                onSaveWord={handleSaveVocabWord}
              />
            )}

            {activeTab === 'grammar' && (
              <GrammarPanel
                subtitles={subtitles}
                userId={user?.id}
                videoId={video.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUBTITLE SCRIPT PANEL
// ==========================================

function SubtitleScriptPanel({
  subtitles,
  currentTimeMs,
}: {
  subtitles: VideoSubtitle[];
  currentTimeMs: number;
}) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentTimeMs]);

  if (subtitles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl mb-3">📝</div>
        <p className="text-[#A0AEC0] text-sm font-medium">No subtitles available</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
      {subtitles.map((sub) => {
        const isActive = currentTimeMs >= sub.start_time_ms && currentTimeMs <= sub.end_time_ms;
        const timeStr = formatTime(sub.start_time_ms);

        return (
          <div
            key={sub.id}
            ref={isActive ? activeRef : null}
            className={clsx(
              'p-2.5 rounded-xl transition-all duration-300 cursor-pointer',
              isActive
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-[#F7FAFC] border border-transparent'
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-[8px] font-black text-[#CBD5E0] mt-0.5 shrink-0 w-10">
                {timeStr}
              </span>
              <p className={clsx(
                'text-sm jp-text leading-relaxed',
                isActive ? 'text-[#3E4A61] font-bold' : 'text-[#718096]'
              )}>
                {sub.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// JLPT ANALYSIS PANEL
// ==========================================

function JLPTAnalysisPanel({
  video,
  subtitles,
}: {
  video: Video;
  subtitles: VideoSubtitle[];
}) {
  const distribution = video.jlpt_distribution as Record<string, number> || {};
  const hasData = Object.keys(distribution).length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-[#3E4A61]">JLPT Level Analysis</h3>
        <p className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-widest mt-0.5">
          Vocabulary distribution
        </p>
      </div>

      {/* Dominant level */}
      {video.jlpt_level && (
        <div className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-2xl">
          <JLPTBadge level={video.jlpt_level} size="md" showLabel />
          <div>
            <p className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">
              Dominant Level
            </p>
            <p className="text-[9px] text-[#A0AEC0]">Most vocabulary at this level</p>
          </div>
        </div>
      )}

      {/* Distribution chart */}
      {hasData ? (
        <JLPTChart distribution={distribution} />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-[#A0AEC0] text-sm font-medium">Analysis not available</p>
          <p className="text-[#CBD5E0] text-xs mt-1">
            {subtitles.length === 0
              ? 'No subtitles to analyze'
              : 'Processing subtitles...'}
          </p>
        </div>
      )}

      {/* Stats summary */}
      {hasData && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(distribution)
            .filter(([k]) => k !== 'unknown')
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 4)
            .map(([level, pct]) => {
              const levelNum = parseInt(level.replace('N', ''));
              return (
                <div key={level} className="p-2.5 bg-[#F7FAFC] rounded-xl text-center">
                  <JLPTBadge level={levelNum} size="xs" className="mb-1" />
                  <p className="text-lg font-black text-[#3E4A61]">{pct}%</p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// VOCAB PANEL
// ==========================================

function VocabPanel({
  stats,
  savedWords,
  onSaveWord,
}: {
  stats: VideoVocabStat[];
  savedWords: Set<string>;
  onSaveWord: (stat: VideoVocabStat) => void;
}) {
  const [view, setView] = useState<'cloud' | 'table'>('cloud');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#3E4A61]">Vocabulary</h3>
          <p className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-widest mt-0.5">
            {stats.length} unique words
          </p>
        </div>
        <div className="flex bg-[#F7FAFC] p-0.5 rounded-xl border border-border/20">
          {(['cloud', 'table'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-200',
                view === v ? 'bg-white text-primary shadow-sm' : 'text-[#A0AEC0]'
              )}
            >
              {v === 'cloud' ? '☁️' : '📋'}
            </button>
          ))}
        </div>
      </div>

      {view === 'cloud' ? (
        <VocabWordCloud
          stats={stats}
          savedWords={savedWords}
          onSaveWord={onSaveWord}
        />
      ) : (
        <VocabFrequencyTable
          stats={stats}
          savedWords={savedWords}
          onSaveWord={onSaveWord}
        />
      )}
    </div>
  );
}

// ==========================================
// GRAMMAR PANEL
// ==========================================

function GrammarPanel({
  subtitles,
  userId,
  videoId,
}: {
  subtitles: VideoSubtitle[];
  userId?: string;
  videoId: string;
}) {
  const grammarPoints = subtitles.flatMap(s =>
    (s.grammar_points || []).map(gp => ({
      ...gp,
      context: s.text,
      timestamp: s.start_time_ms,
    }))
  );

  // Deduplicate by pattern
  const uniqueGrammar = grammarPoints.reduce((acc, gp) => {
    if (!acc.find(g => g.pattern === gp.pattern)) {
      acc.push(gp);
    }
    return acc;
  }, [] as typeof grammarPoints);

  if (uniqueGrammar.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl mb-3">📖</div>
        <p className="text-[#A0AEC0] text-sm font-medium">No grammar patterns detected</p>
        <p className="text-[#CBD5E0] text-xs mt-1">
          Grammar detection requires processed subtitles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-[#3E4A61]">Grammar Patterns</h3>
        <p className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-widest mt-0.5">
          {uniqueGrammar.length} patterns found
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {uniqueGrammar.map((gp, idx) => (
          <GrammarPointCard
            key={idx}
            grammarPoint={gp}
            userId={userId}
            videoId={videoId}
          />
        ))}
      </div>
    </div>
  );
}

function GrammarPointCard({
  grammarPoint,
  userId,
  videoId,
}: {
  grammarPoint: any;
  userId?: string;
  videoId: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const handleBookmark = async () => {
    if (!userId || !grammarPoint.ku_id) return;
    try {
      await videoService.bookmarkGrammar(userId, grammarPoint.ku_id, {
        source_video_id: videoId,
        source_timestamp_ms: grammarPoint.timestamp,
        context_sentence: grammarPoint.context,
      });
      setBookmarked(true);
    } catch (err) {
      console.error('Failed to bookmark grammar:', err);
    }
  };

  const handleExpand = async () => {
    if (!expanded && grammarPoint.ku_id && !details) {
      const data = await videoService.lookupGrammar(grammarPoint.ku_id);
      setDetails(data);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="border border-border/30 rounded-2xl overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between p-3 hover:bg-[#F7FAFC] transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-[#3E4A61] jp-text">{grammarPoint.pattern}</span>
          {grammarPoint.jlpt && (
            <JLPTBadge level={grammarPoint.jlpt} size="xs" />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {userId && grammarPoint.ku_id && (
            <button
              onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
              className={clsx(
                'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
                bookmarked ? 'text-primary' : 'text-[#CBD5E0] hover:text-primary'
              )}
            >
              {bookmarked ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
            </button>
          )}
          {expanded ? <ChevronUp size={14} className="text-[#CBD5E0]" /> : <ChevronDown size={14} className="text-[#CBD5E0]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/20">
          {/* Context */}
          <div className="bg-[#F7FAFC] rounded-xl p-2">
            <p className="text-[9px] font-black text-[#CBD5E0] uppercase tracking-widest mb-1">Context</p>
            <p className="text-xs text-[#718096] jp-text">{grammarPoint.context}</p>
          </div>

          {/* Details */}
          {details ? (
            <div className="space-y-1.5">
              {details.explanation && (
                <p className="text-xs text-[#718096] leading-relaxed">{details.explanation}</p>
              )}
              {details.example_sentences?.[0] && (
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Example</p>
                  <p className="text-xs text-[#3E4A61] jp-text">{details.example_sentences[0].ja}</p>
                  <p className="text-[10px] text-[#A0AEC0]">{details.example_sentences[0].en}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <Loader2 size={12} className="text-[#CBD5E0] animate-spin" />
              <span className="text-[10px] text-[#CBD5E0]">Loading details...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// HELPERS
// ==========================================

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
