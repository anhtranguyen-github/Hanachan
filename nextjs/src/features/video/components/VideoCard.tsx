'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Play,
  Heart,
  BookmarkPlus,
  BookmarkCheck,
  Clock,
  CheckCircle2,
  MoreVertical,
  Folder,
} from 'lucide-react';
import { JLPTBadge, JLPTDistributionBar } from './JLPTBadge';
import type { UserVideoLibraryEntry, VideoCategory } from '../types';

interface VideoCardProps {
  entry: UserVideoLibraryEntry;
  categories: VideoCategory[];
  view?: 'grid' | 'list';
  onToggleFavorite?: (videoId: string, isFavorite: boolean) => void;
  onRemove?: (videoId: string) => void;
  onAssignCategory?: (videoId: string, categoryId: string | null) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoCard({
  entry,
  categories,
  view = 'grid',
  onToggleFavorite,
  onRemove,
  onAssignCategory,
}: VideoCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const video = entry.video;
  const progress = entry.progress;
  const category = entry.category;

  if (!video) return null;

  const progressPct = progress?.progress_percent || 0;
  const isCompleted = progress?.completed || false;
  const isInProgress = progressPct > 0 && !isCompleted;

  if (view === 'list') {
    return (
      <div className="glass-card p-3 flex items-center gap-4 group hover:border-primary/20 border border-transparent transition-all duration-300 relative">
        {/* Thumbnail */}
        <Link href={`/videos/${video.id}`} className="shrink-0 relative">
          <div className="w-24 h-14 rounded-xl overflow-hidden bg-[#F7FAFC]">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play size={20} className="text-[#CBD5E0]" />
              </div>
            )}
          </div>
          {/* Progress overlay */}
          {progressPct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-[#48BB78] rounded-full flex items-center justify-center">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/videos/${video.id}`}>
            <h3 className="text-sm font-black text-[#3E4A61] truncate hover:text-primary transition-colors">
              {video.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {video.channel_name && (
              <span className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-wide">
                {video.channel_name}
              </span>
            )}
            {video.duration_seconds > 0 && (
              <span className="text-[9px] text-[#CBD5E0] flex items-center gap-0.5">
                <Clock size={9} />
                {formatDuration(video.duration_seconds)}
              </span>
            )}
            <JLPTBadge level={video.jlpt_level} size="xs" />
            {category && (
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.icon} {category.name}
              </span>
            )}
          </div>
          {isInProgress && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-[#F7FAFC] rounded-full overflow-hidden max-w-[120px]">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[8px] font-black text-[#A0AEC0]">{progressPct}%</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite?.(video.id, !entry.is_favorite)}
            className={clsx(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
              entry.is_favorite
                ? 'text-primary bg-primary/10'
                : 'text-[#CBD5E0] hover:text-primary hover:bg-primary/5'
            )}
          >
            <Heart size={14} fill={entry.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#CBD5E0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] transition-all duration-200"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <VideoCardMenu
                entry={entry}
                categories={categories}
                onClose={() => setMenuOpen(false)}
                onRemove={onRemove}
                onAssignCategory={onAssignCategory}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="glass-card overflow-hidden group hover:border-primary/20 border border-transparent transition-all duration-300 relative flex flex-col">
      {/* Thumbnail */}
      <Link href={`/videos/${video.id}`} className="relative block">
        <div className="aspect-video bg-[#F7FAFC] overflow-hidden">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play size={32} className="text-[#CBD5E0]" />
            </div>
          )}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg">
            <Play size={20} className="text-[#3E4A61] ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Progress bar */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#48BB78] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
            <CheckCircle2 size={10} />
            Done
          </div>
        )}

        {/* Duration */}
        {video.duration_seconds > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {formatDuration(video.duration_seconds)}
          </div>
        )}
      </Link>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title & badges */}
        <div className="flex items-start justify-between gap-2">
          <Link href={`/videos/${video.id}`} className="flex-1 min-w-0">
            <h3 className="text-[13px] font-black text-[#3E4A61] line-clamp-2 leading-snug hover:text-primary transition-colors">
              {video.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite?.(video.id, !entry.is_favorite)}
              className={clsx(
                'w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200',
                entry.is_favorite
                  ? 'text-primary'
                  : 'text-[#E2E8F0] hover:text-primary'
              )}
            >
              <Heart size={13} fill={entry.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#E2E8F0] hover:text-[#3E4A61] transition-all duration-200"
              >
                <MoreVertical size={13} />
              </button>
              {menuOpen && (
                <VideoCardMenu
                  entry={entry}
                  categories={categories}
                  onClose={() => setMenuOpen(false)}
                  onRemove={onRemove}
                  onAssignCategory={onAssignCategory}
                />
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {video.channel_name && (
            <span className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-wide truncate max-w-[100px]">
              {video.channel_name}
            </span>
          )}
          <JLPTBadge level={video.jlpt_level} size="xs" />
        </div>

        {/* Category pill */}
        {category && (
          <div className="flex items-center gap-1">
            <span
              className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.icon} {category.name}
            </span>
          </div>
        )}

        {/* Progress */}
        {progressPct > 0 && (
          <div className="mt-auto pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-wide">
                {isCompleted ? 'Completed' : 'Progress'}
              </span>
              <span className="text-[8px] font-black" style={{ color: isCompleted ? '#48BB78' : '#F4ACB7' }}>
                {progressPct}%
              </span>
            </div>
            <div className="h-1 bg-[#F7FAFC] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: isCompleted ? '#48BB78' : '#F4ACB7',
                }}
              />
            </div>
          </div>
        )}

        {/* JLPT distribution */}
        {video.jlpt_distribution && Object.keys(video.jlpt_distribution).length > 0 && (
          <JLPTDistributionBar
            distribution={video.jlpt_distribution as Record<string, number>}
            className="mt-auto"
          />
        )}
      </div>
    </div>
  );
}

// Context menu for video card
function VideoCardMenu({
  entry,
  categories,
  onClose,
  onRemove,
  onAssignCategory,
}: {
  entry: UserVideoLibraryEntry;
  categories: VideoCategory[];
  onClose: () => void;
  onRemove?: (videoId: string) => void;
  onAssignCategory?: (videoId: string, categoryId: string | null) => void;
}) {
  const videoId = entry.video_id;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-8 z-50 bg-white border border-border/40 rounded-2xl shadow-xl shadow-black/10 p-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Category assignment */}
        <div className="px-2 py-1 text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">
          Move to
        </div>
        <button
          onClick={() => { onAssignCategory?.(videoId, null); onClose(); }}
          className={clsx(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-colors',
            !entry.category_id ? 'text-primary bg-primary/5' : 'text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]'
          )}
        >
          <Folder size={12} />
          Uncategorized
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { onAssignCategory?.(videoId, cat.id); onClose(); }}
            className={clsx(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-colors',
              entry.category_id === cat.id ? 'bg-primary/5' : 'text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]'
            )}
            style={entry.category_id === cat.id ? { color: cat.color } : {}}
          >
            <span>{cat.icon}</span>
            <span className="truncate">{cat.name}</span>
          </button>
        ))}

        <div className="mx-2 my-1 h-px bg-border/30" />

        <button
          onClick={() => { onRemove?.(videoId); onClose(); }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] font-bold text-[#FF6B6B] hover:bg-red-50 transition-colors"
        >
          Remove from library
        </button>
      </div>
    </>
  );
}
