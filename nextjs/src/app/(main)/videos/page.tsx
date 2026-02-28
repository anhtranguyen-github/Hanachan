'use client';

import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Filter,
  SortAsc,
  Folder,
  FolderPlus,
  Heart,
  Play,
  X,
  Loader2,
  BookmarkPlus,
  ChevronDown,
} from 'lucide-react';
import { useUser } from '@/features/auth/AuthContext';
import { useVideoLibrary } from '@/features/video/hooks/useVideoLibrary';
import { VideoCard } from '@/features/video/components/VideoCard';
import { JLPTBadge } from '@/features/video/components/JLPTBadge';
import type { LibraryFilterBy, LibrarySortBy, CreateCategoryRequest } from '@/features/video/types';

const CATEGORY_COLORS = [
  '#F4ACB7', '#A2D2FF', '#CDB4DB', '#B7E4C7', '#FFD6A5',
  '#FF9F9F', '#9BF6FF', '#CAFFBF', '#FDFFB6', '#BDE0FE',
];

const CATEGORY_ICONS = ['📚', '🎌', '🎧', '📝', '🎯', '⭐', '🔥', '💡', '🎵', '🌸'];

export default function VideoLibraryPage() {
  const { user } = useUser();
  const {
    entries,
    categories,
    loading,
    error,
    filters,
    updateFilters,
    removeVideo,
    toggleFavorite,
    assignCategory,
    createCategory,
    deleteCategory,
    addVideo,
  } = useVideoLibrary(user?.id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ searchQuery: e.target.value });
  }, [updateFilters]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="text-primary animate-spin" />
          <p className="text-[#A0AEC0] text-sm font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto space-y-4 animate-page-entrance">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#3E4A61] tracking-tight">Video Library</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0] mt-0.5">
            {entries.length} video{entries.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7FAFC] border border-border/30 text-[10px] font-black text-[#A0AEC0] hover:text-[#3E4A61] hover:border-border/60 transition-all uppercase tracking-wide"
          >
            <FolderPlus size={13} />
            New Category
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wide hover:bg-primary-dark transition-all shadow-sm shadow-primary/20"
          >
            <Plus size={13} />
            Add Video
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="glass-card p-3 space-y-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CBD5E0]" />
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-3 py-2 bg-[#F7FAFC] border border-border/30 rounded-xl text-sm text-[#3E4A61] placeholder-[#CBD5E0] focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-[#F7FAFC] p-0.5 rounded-xl border border-border/20">
            {(['grid', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => updateFilters({ view: v })}
                className={clsx(
                  'w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200',
                  filters.view === v ? 'bg-white text-primary shadow-sm' : 'text-[#A0AEC0]'
                )}
              >
                {v === 'grid' ? <Grid3X3 size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all',
              showFilters
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-[#F7FAFC] text-[#A0AEC0] border border-border/20 hover:text-[#3E4A61]'
            )}
          >
            <Filter size={13} />
            Filters
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border/20 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Filter by status */}
            <div className="space-y-1">
              <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Status</p>
              <div className="flex gap-1 flex-wrap">
                {([
                  { value: 'all', label: 'All' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'not_started', label: 'Not Started' },
                  { value: 'favorites', label: '❤️ Favorites' },
                ] as { value: LibraryFilterBy; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilters({ filterBy: opt.value })}
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide transition-all',
                      filters.filterBy === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-[#F7FAFC] text-[#A0AEC0] hover:text-[#3E4A61]'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort by */}
            <div className="space-y-1">
              <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Sort</p>
              <div className="flex gap-1 flex-wrap">
                {([
                  { value: 'date_added', label: 'Date Added' },
                  { value: 'progress', label: 'Progress' },
                  { value: 'title', label: 'Title' },
                  { value: 'jlpt_level', label: 'JLPT Level' },
                ] as { value: LibrarySortBy; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilters({ sortBy: opt.value })}
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide transition-all',
                      filters.sortBy === opt.value
                        ? 'bg-[#3E4A61] text-white'
                        : 'bg-[#F7FAFC] text-[#A0AEC0] hover:text-[#3E4A61]'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* JLPT filter */}
            <div className="space-y-1">
              <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">JLPT Level</p>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => updateFilters({ jlptLevel: null })}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide transition-all',
                    !filters.jlptLevel ? 'bg-[#3E4A61] text-white' : 'bg-[#F7FAFC] text-[#A0AEC0]'
                  )}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map(level => (
                  <button
                    key={level}
                    onClick={() => updateFilters({ jlptLevel: filters.jlptLevel === level ? null : level })}
                    className="transition-all"
                  >
                    <JLPTBadge
                      level={level}
                      size="xs"
                      className={clsx(
                        'cursor-pointer transition-all',
                        filters.jlptLevel === level ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => updateFilters({ categoryId: null })}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition-all shrink-0',
              !filters.categoryId
                ? 'bg-[#3E4A61] text-white'
                : 'bg-[#F7FAFC] text-[#A0AEC0] hover:text-[#3E4A61] border border-border/20'
            )}
          >
            <Folder size={11} />
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => updateFilters({ categoryId: filters.categoryId === cat.id ? null : cat.id })}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition-all shrink-0 border',
              )}
              style={{
                backgroundColor: filters.categoryId === cat.id ? cat.color : `${cat.color}20`,
                color: filters.categoryId === cat.id ? 'white' : cat.color,
                borderColor: `${cat.color}40`,
              }}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {entries.length === 0 ? (
        <EmptyState
          hasFilters={filters.filterBy !== 'all' || !!filters.searchQuery || !!filters.categoryId}
          onAddVideo={() => setShowAddModal(true)}
          onClearFilters={() => updateFilters({ filterBy: 'all', searchQuery: '', categoryId: null, jlptLevel: null })}
        />
      ) : (
        <div className={clsx(
          filters.view === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        )}>
          {entries.map(entry => (
            <VideoCard
              key={entry.id}
              entry={entry}
              categories={categories}
              view={filters.view}
              onToggleFavorite={toggleFavorite}
              onRemove={removeVideo}
              onAssignCategory={assignCategory}
            />
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <AddVideoModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (youtubeId) => {
            // First ensure video exists in DB
            const res = await fetch('/api/videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ youtube_id: youtubeId }),
            });
            const data = await res.json();
            if (data.video) {
              await addVideo({ video_id: data.video.id });
            }
            setShowAddModal(false);
          }}
        />
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreate={async (req) => {
            await createCategory(req);
            setShowCategoryModal(false);
          }}
        />
      )}
    </main>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({
  hasFilters,
  onAddVideo,
  onClearFilters,
}: {
  hasFilters: boolean;
  onAddVideo: () => void;
  onClearFilters: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <div>
          <h3 className="text-lg font-black text-[#3E4A61]">No videos match your filters</h3>
          <p className="text-[#A0AEC0] text-sm mt-1">Try adjusting your search or filters</p>
        </div>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-[#F7FAFC] border border-border/30 rounded-xl text-[10px] font-black text-[#A0AEC0] hover:text-[#3E4A61] uppercase tracking-wide transition-all"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20 animate-pulse" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-primary/30">
          🎬
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-[#3E4A61]">Your library is empty</h3>
        <p className="text-[#A0AEC0] text-sm mt-2 max-w-xs">
          Save Japanese videos to study with interactive subtitles, JLPT analysis, and vocabulary tools
        </p>
      </div>
      <button
        onClick={onAddVideo}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-wide hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
      >
        <Plus size={16} />
        Add Your First Video
      </button>
    </div>
  );
}

// ==========================================
// ADD VIDEO MODAL
// ==========================================

function AddVideoModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (youtubeId: string) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractYoutubeId = (input: string): string | null => {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct ID
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const youtubeId = extractYoutubeId(url.trim());

    if (!youtubeId) {
      setError('Please enter a valid YouTube URL or video ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAdd(youtubeId);
    } catch (err: any) {
      setError(err.message || 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-[#3E4A61]">Add Video</h2>
            <p className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-widest mt-0.5">
              Paste a YouTube URL or video ID
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#CBD5E0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... or video ID"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-border/30 rounded-xl text-sm text-[#3E4A61] placeholder-[#CBD5E0] focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
              autoFocus
            />
            {error && (
              <p className="text-[10px] text-[#FF6B6B] mt-1.5 font-bold">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border/30 text-[11px] font-black text-[#A0AEC0] hover:text-[#3E4A61] uppercase tracking-wide transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-wide hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}
              {loading ? 'Adding...' : 'Add to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// CREATE CATEGORY MODAL
// ==========================================

function CreateCategoryModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (req: CreateCategoryRequest) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreate({ name: name.trim(), color, icon });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-[#3E4A61]">New Category</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#CBD5E0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest block mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. JLPT N3 Listening"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F7FAFC] border border-border/30 rounded-xl text-sm text-[#3E4A61] placeholder-[#CBD5E0] focus:outline-none focus:border-primary/40 transition-all"
              autoFocus
            />
          </div>

          {/* Icon */}
          <div>
            <label className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest block mb-1.5">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={clsx(
                    'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                    icon === i ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-[#F7FAFC] hover:bg-[#EDF2F7]'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest block mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c, ringColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 bg-[#F7FAFC] rounded-xl">
            <span
              className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: `${color}30`, color }}
            >
              {icon} {name || 'Preview'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border/30 text-[11px] font-black text-[#A0AEC0] hover:text-[#3E4A61] uppercase tracking-wide transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-wide hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
