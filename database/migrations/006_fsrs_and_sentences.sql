-- ==========================================================
-- MIGRATION 006: FSRS Engine & Sentence Library
-- Created: 2026-03-02
-- Features: FSRS tracking tables, Sentence Library, Video FSRS
-- ==========================================================

-- ==========================================
-- FSRS STATES (Extended learning tracking)
-- ==========================================
-- Generic FSRS state table that works with KUs, sentences, and videos
CREATE TABLE IF NOT EXISTS public.user_fsrs_states (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,  -- Can reference KU, sentence, or video
  item_type text NOT NULL CHECK (item_type IN ('ku', 'sentence', 'video')),
  facet text NOT NULL DEFAULT 'meaning' CHECK (facet IN ('meaning', 'reading', 'cloze', 'content')),
  state text NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  stability double precision NOT NULL DEFAULT 0,  -- S in FSRS (days)
  difficulty double precision NOT NULL DEFAULT 5.0,  -- D in FSRS (0-10)
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  last_review timestamp with time zone,
  next_review timestamp with time zone DEFAULT NOW(),
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id, item_type, facet)
);

CREATE INDEX idx_user_fsrs_states_user ON public.user_fsrs_states(user_id);
CREATE INDEX idx_user_fsrs_states_next_review ON public.user_fsrs_states(user_id, next_review);
CREATE INDEX idx_user_fsrs_states_item ON public.user_fsrs_states(item_id, item_type);

-- ==========================================
-- FSRS REVIEW LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.fsrs_review_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  item_type text NOT NULL,
  facet text NOT NULL DEFAULT 'meaning',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 4),  -- 1=Again, 2=Hard, 3=Good, 4=Easy
  state text NOT NULL,  -- State before review
  stability double precision NOT NULL,
  difficulty double precision NOT NULL,
  interval_days double precision NOT NULL,
  reviewed_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_fsrs_review_logs_user ON public.fsrs_review_logs(user_id, reviewed_at);
CREATE INDEX idx_fsrs_review_logs_item ON public.fsrs_review_logs(item_id, item_type);

-- ==========================================
-- SENTENCE LIBRARY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sentences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Content
  japanese text NOT NULL,
  furigana text,
  romaji text,
  english text NOT NULL,
  -- Source tracking
  source_type text NOT NULL CHECK (source_type IN ('manual', 'video', 'reading', 'chat', 'import')),
  source_id uuid,  -- Reference to video, reading session, etc.
  source_timestamp integer,  -- For video: timestamp in ms
  -- Analysis
  jlpt_level integer CHECK (jlpt_level BETWEEN 1 AND 5),
  difficulty_score integer DEFAULT 50 CHECK (difficulty_score BETWEEN 1 AND 100),
  word_count integer DEFAULT 0,
  -- Tokens (parsed)
  tokens jsonb DEFAULT '[]',  -- [{surface, reading, pos, base_form, jlpt_level}]
  featured_ku_ids uuid[] DEFAULT '{}',  -- Linked knowledge units
  featured_grammar_ids uuid[] DEFAULT '{}',  -- Linked grammar points
  -- Tags and organization
  tags text[] DEFAULT '{}',
  category text DEFAULT 'general',  -- User-defined category
  -- Status
  is_favorite boolean DEFAULT false,
  notes text,
  -- Timestamps
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_sentences_user ON public.sentences(user_id);
CREATE INDEX idx_sentences_source ON public.sentences(source_type, source_id);
CREATE INDEX idx_sentences_jlpt ON public.sentences(user_id, jlpt_level);
CREATE INDEX idx_sentences_favorite ON public.sentences(user_id, is_favorite);
CREATE INDEX idx_sentences_featured_ku ON public.sentences USING GIN(featured_ku_ids);

-- Sentence embeddings for semantic search
CREATE TABLE IF NOT EXISTS public.sentence_embeddings (
  sentence_id uuid NOT NULL REFERENCES public.sentences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  embedding vector(1536),  -- OpenAI text-embedding-3-small
  embedding_model text DEFAULT 'text-embedding-3-small',
  created_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (sentence_id)
);

CREATE INDEX idx_sentence_embeddings_vector ON public.sentence_embeddings 
  USING ivfflat (embedding vector_cosine_ops);

-- ==========================================
-- VIDEO EMBEDDINGS (for semantic search)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.video_embeddings (
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  embedding_type text NOT NULL CHECK (embedding_type IN ('title', 'description', 'transcript_summary')),
  embedding vector(1536),
  embedding_model text DEFAULT 'text-embedding-3-small',
  content_summary text,  -- Summary of what was embedded
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (video_id, embedding_type)
);

CREATE INDEX idx_video_embeddings_vector ON public.video_embeddings 
  USING ivfflat (embedding vector_cosine_ops);

-- ==========================================
-- USER VIDEO LEARNING PROGRESS (FSRS for videos)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  -- Progress tracking
  watch_time_seconds integer DEFAULT 0,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  is_completed boolean DEFAULT false,
  -- Learning stats
  unique_words_seen integer DEFAULT 0,
  unique_words_learned integer DEFAULT 0,  -- Words marked as known
  sentences_added integer DEFAULT 0,
  -- FSRS state for video content
  content_state text DEFAULT 'new' CHECK (content_state IN ('new', 'learning', 'review', 'mastered')),
  content_stability double precision DEFAULT 0,
  content_difficulty double precision DEFAULT 5.0,
  content_reps integer DEFAULT 0,
  last_watched_at timestamp with time zone,
  next_review_at timestamp with time zone,
  -- Timestamps
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_user_video_progress_user ON public.user_video_progress(user_id);
CREATE INDEX idx_user_video_progress_review ON public.user_video_progress(user_id, next_review_at);

-- ==========================================
-- VIDEO VOCABULARY TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_video_vocab (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  ku_id uuid REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  surface text NOT NULL,  -- The word as it appeared
  -- Status
  status text DEFAULT 'new' CHECK (status IN ('new', 'learning', 'known', 'ignored')),
  first_seen_at timestamp with time zone DEFAULT NOW(),
  marked_known_at timestamp with time zone,
  encounter_count integer DEFAULT 1,
  -- Context
  example_sentence text,
  timestamp_ms integer,  -- When in the video this word appeared
  PRIMARY KEY (user_id, video_id, surface)
);

CREATE INDEX idx_user_video_vocab_user ON public.user_video_vocab(user_id);
CREATE INDEX idx_user_video_vocab_video ON public.user_video_vocab(video_id);
CREATE INDEX idx_user_video_vocab_status ON public.user_video_vocab(user_id, status);
CREATE INDEX idx_user_video_vocab_ku ON public.user_video_vocab(ku_id);

-- ==========================================
-- AGENT LESSON SESSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.agent_lesson_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('lesson', 'review', 'mixed')),
  -- Configuration
  target_item_count integer DEFAULT 5,
  focus_areas text[] DEFAULT '{}',  -- ['vocabulary', 'grammar', 'kanji']
  difficulty_range text DEFAULT 'auto',  -- 'N5', 'N4-N3', 'auto'
  -- Progress
  items_presented integer DEFAULT 0,
  items_completed integer DEFAULT 0,
  items jsonb DEFAULT '[]',  -- [{item_id, item_type, status}]
  -- Metadata
  started_at timestamp with time zone DEFAULT NOW(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_agent_lesson_sessions_user ON public.agent_lesson_sessions(user_id, started_at);

-- ==========================================
-- UPDATE TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_sentences_updated_at ON public.sentences;
CREATE TRIGGER update_sentences_updated_at
    BEFORE UPDATE ON public.sentences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_embeddings_updated_at ON public.video_embeddings;
CREATE TRIGGER update_video_embeddings_updated_at
    BEFORE UPDATE ON public.video_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_video_progress_updated_at ON public.user_video_progress;
CREATE TRIGGER update_user_video_progress_updated_at
    BEFORE UPDATE ON public.user_video_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- VIEWS FOR CONVENIENCE
-- ==========================================

-- View: User's due reviews summary
CREATE OR REPLACE VIEW public.v_user_due_reviews AS
SELECT 
    user_id,
    item_type,
    COUNT(*) as due_count,
    MIN(next_review) as earliest_due
FROM public.user_fsrs_states
WHERE next_review <= NOW() + INTERVAL '1 day'
GROUP BY user_id, item_type;

-- View: Sentence library with learning stats
CREATE OR REPLACE VIEW public.v_sentence_library AS
SELECT 
    s.*,
    fs.state as learning_state,
    fs.next_review,
    fs.stability,
    fs.difficulty
FROM public.sentences s
LEFT JOIN public.user_fsrs_states fs 
    ON fs.item_id = s.id 
    AND fs.item_type = 'sentence'
    AND fs.user_id = s.user_id;

-- ==========================================
-- NOTES
-- ==========================================
-- 1. FSRS states are independent per facet (meaning, reading, etc.)
-- 2. Sentences can be linked to videos via source_id
-- 3. Video embeddings enable semantic search for content
-- 4. User video progress tracks both watch progress and FSRS state
