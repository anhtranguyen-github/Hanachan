-- ==========================================================
-- MIGRATION 003: VIDEO LEARNING SYSTEM
-- Created: 2026-02-28
-- Features: Custom Library, Video Progress, JLPT Analysis,
--           Grammar Detection, Vocabulary Stats
-- ==========================================================

-- ==========================================
-- VIDEO DOMAIN
-- ==========================================

-- Videos table: stores YouTube/external video metadata
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  youtube_id text UNIQUE, -- YouTube video ID
  title text NOT NULL,
  description text,
  channel_name text,
  thumbnail_url text,
  duration_seconds integer DEFAULT 0,
  language text DEFAULT 'ja', -- Primary language
  jlpt_level integer CHECK (jlpt_level BETWEEN 1 AND 5), -- Dominant JLPT level
  jlpt_distribution jsonb DEFAULT '{}', -- {N5: 40, N4: 30, N3: 20, N2: 8, N1: 2}
  tags text[] DEFAULT '{}',
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_videos_youtube_id ON public.videos(youtube_id);
CREATE INDEX idx_videos_jlpt_level ON public.videos(jlpt_level);

-- Subtitles table: stores tokenized subtitle data per video
CREATE TABLE IF NOT EXISTS public.video_subtitles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  start_time_ms integer NOT NULL, -- Start time in milliseconds
  end_time_ms integer NOT NULL,   -- End time in milliseconds
  text text NOT NULL,             -- Raw subtitle text
  tokens jsonb DEFAULT '[]',      -- Tokenized words: [{surface, reading, pos, jlpt, ku_id}]
  grammar_points jsonb DEFAULT '[]', -- Detected grammar: [{pattern, ku_id, start, end}]
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_video_subtitles_video ON public.video_subtitles(video_id);
CREATE INDEX idx_video_subtitles_time ON public.video_subtitles(video_id, start_time_ms);

-- Video vocabulary stats: pre-computed word frequency per video
CREATE TABLE IF NOT EXISTS public.video_vocab_stats (
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  ku_id uuid REFERENCES public.knowledge_units(id) ON DELETE SET NULL,
  surface text NOT NULL,          -- Surface form of the word
  reading text,                   -- Hiragana reading
  frequency integer DEFAULT 1,   -- How many times it appears
  jlpt integer CHECK (jlpt BETWEEN 1 AND 5),
  meaning text,                   -- Cached meaning
  PRIMARY KEY (video_id, surface)
);

CREATE INDEX idx_video_vocab_stats_video ON public.video_vocab_stats(video_id);
CREATE INDEX idx_video_vocab_stats_jlpt ON public.video_vocab_stats(video_id, jlpt);

-- ==========================================
-- USER VIDEO LIBRARY
-- ==========================================

-- Video categories: user-defined collections
CREATE TABLE IF NOT EXISTS public.video_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#F4ACB7', -- Hex color for pill
  icon text DEFAULT '📚',       -- Emoji icon
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_video_categories_user ON public.video_categories(user_id);

-- User video library: saved videos with category assignment
CREATE TABLE IF NOT EXISTS public.user_video_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.video_categories(id) ON DELETE SET NULL,
  notes text,
  is_favorite boolean DEFAULT false,
  added_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, video_id)
);

CREATE INDEX idx_user_video_library_user ON public.user_video_library(user_id);
CREATE INDEX idx_user_video_library_category ON public.user_video_library(user_id, category_id);
CREATE INDEX idx_user_video_library_favorite ON public.user_video_library(user_id, is_favorite);

-- Video progress: tracks watch progress per user per video
CREATE TABLE IF NOT EXISTS public.video_progress (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  last_position_ms integer DEFAULT 0,  -- Last watched position in ms
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed boolean DEFAULT false,
  watch_count integer DEFAULT 0,       -- How many times fully watched
  last_watched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_video_progress_user ON public.video_progress(user_id);
CREATE INDEX idx_video_progress_completed ON public.video_progress(user_id, completed);

-- ==========================================
-- USER VOCABULARY FROM VIDEOS
-- ==========================================

-- Words saved from video subtitles to user vocabulary list
CREATE TABLE IF NOT EXISTS public.user_saved_words (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ku_id uuid REFERENCES public.knowledge_units(id) ON DELETE SET NULL,
  surface text NOT NULL,
  reading text,
  meaning text,
  jlpt integer CHECK (jlpt BETWEEN 1 AND 5),
  source_video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  source_timestamp_ms integer,  -- Where in the video this was saved
  notes text,
  saved_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, surface)
);

CREATE INDEX idx_user_saved_words_user ON public.user_saved_words(user_id);
CREATE INDEX idx_user_saved_words_video ON public.user_saved_words(user_id, source_video_id);

-- ==========================================
-- USER GRAMMAR BOOKMARKS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_grammar_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ku_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  source_video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  source_timestamp_ms integer,
  context_sentence text,  -- The sentence where it was found
  notes text,
  bookmarked_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, ku_id)
);

CREATE INDEX idx_user_grammar_bookmarks_user ON public.user_grammar_bookmarks(user_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_vocab_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grammar_bookmarks ENABLE ROW LEVEL SECURITY;

-- Videos: readable by all authenticated users
CREATE POLICY "videos_read" ON public.videos FOR SELECT TO authenticated USING (true);

-- Subtitles: readable by all authenticated users
CREATE POLICY "subtitles_read" ON public.video_subtitles FOR SELECT TO authenticated USING (true);

-- Vocab stats: readable by all authenticated users
CREATE POLICY "vocab_stats_read" ON public.video_vocab_stats FOR SELECT TO authenticated USING (true);

-- Categories: users manage their own
CREATE POLICY "categories_select" ON public.video_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON public.video_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON public.video_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON public.video_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Library: users manage their own
CREATE POLICY "library_select" ON public.user_video_library FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "library_insert" ON public.user_video_library FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "library_update" ON public.user_video_library FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "library_delete" ON public.user_video_library FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Progress: users manage their own
CREATE POLICY "progress_select" ON public.video_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "progress_insert" ON public.video_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON public.video_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Saved words: users manage their own
CREATE POLICY "saved_words_select" ON public.user_saved_words FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saved_words_insert" ON public.user_saved_words FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_words_update" ON public.user_saved_words FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saved_words_delete" ON public.user_saved_words FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Grammar bookmarks: users manage their own
CREATE POLICY "grammar_bookmarks_select" ON public.user_grammar_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "grammar_bookmarks_insert" ON public.user_grammar_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grammar_bookmarks_delete" ON public.user_grammar_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
