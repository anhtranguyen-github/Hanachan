-- ==========================================================
-- HANACHAN V2 - FINAL SCHEMA
-- Updated: 2026-01-30
-- ==========================================================
-- This schema reflects the current state after all migrations.
-- Tables: users, knowledge_units, details, questions, 
--         lesson_batches, lesson_items, review_sessions, review_session_items,
--         user_learning_states, user_learning_logs, chat_sessions, chat_messages
-- ==========================================================

-- CLEANUP
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.user_learning_logs CASCADE;
DROP TABLE IF EXISTS public.user_learning_states CASCADE;
DROP TABLE IF EXISTS public.review_session_items CASCADE;
DROP TABLE IF EXISTS public.review_sessions CASCADE;
DROP TABLE IF EXISTS public.lesson_items CASCADE;
DROP TABLE IF EXISTS public.lesson_batches CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.grammar_relations CASCADE;
DROP TABLE IF EXISTS public.vocabulary_kanji CASCADE;
DROP TABLE IF EXISTS public.kanji_radicals CASCADE;
DROP TABLE IF EXISTS public.grammar_details CASCADE;
DROP TABLE IF EXISTS public.vocabulary_details CASCADE;
DROP TABLE IF EXISTS public.kanji_details CASCADE;
DROP TABLE IF EXISTS public.radical_details CASCADE;
DROP TABLE IF EXISTS public.knowledge_units CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ==========================================
-- USER DOMAIN
-- ==========================================
-- Note: user_settings table has been REMOVED.
-- Settings are managed via defaults and level-based logic.

CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY, -- Link to auth.users.id
  display_name text,
  level integer DEFAULT 1, -- Current curriculum level (1-60)
  last_activity_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- CONTENT DOMAIN
-- ==========================================
CREATE TABLE public.knowledge_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('radical', 'kanji', 'vocabulary', 'grammar')),
  level integer NOT NULL, -- Curriculum level (1-60)
  jlpt integer CHECK (jlpt BETWEEN 1 AND 5), -- JLPT N5-N1
  character text, -- Kanji character or vocabulary word
  meaning text NOT NULL, -- Primary meaning
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_units_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_ku_level_type ON public.knowledge_units(level, type);
CREATE INDEX idx_ku_type ON public.knowledge_units(type);

-- Extension tables for different KU types
CREATE TABLE public.radical_details (
  ku_id uuid PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  meaning_mnemonic text,
  image_url text
);

CREATE TABLE public.kanji_details (
  ku_id uuid PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  onyomi text[],
  kunyomi text[],
  meaning_mnemonic text,
  reading_mnemonic text,
  stroke_order_svg text,
  stroke_video_url text
);

CREATE TABLE public.vocabulary_details (
  ku_id uuid PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  reading text NOT NULL, -- Hiragana/Katakana reading
  audio_url text,
  parts_of_speech text[],
  pitch_accent jsonb,
  meaning_mnemonic text,
  context_sentences jsonb
);

CREATE TABLE public.grammar_details (
  ku_id uuid PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  structure text,
  explanation text,
  nuance text,
  cautions text,
  external_links jsonb,
  example_sentences jsonb -- List<{ja, en, audio_url}>
);

-- RELATIONSHIP (CROSS-REFERENCING)
CREATE TABLE public.kanji_radicals (
  kanji_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  radical_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  position integer,
  PRIMARY KEY (kanji_id, radical_id)
);

CREATE TABLE public.vocabulary_kanji (
  vocab_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  kanji_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  position integer,
  PRIMARY KEY (vocab_id, kanji_id)
);

CREATE TABLE public.grammar_relations (
  grammar_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  related_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('synonym', 'antonym', 'similar', 'contrast', 'prerequisite')),
  comparison_note text,
  PRIMARY KEY (grammar_id, related_id, type)
);

-- ==========================================
-- QUESTION DOMAIN
-- ==========================================
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ku_id uuid REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('fill_in', 'cloze')),
  facet text DEFAULT 'meaning' CHECK (facet IN ('meaning', 'reading', 'cloze')),
  prompt text NOT NULL,
  cloze_text_with_blanks text, -- "Watashi [0] Gakusei [1]."
  correct_answers text[],
  hints text[],
  PRIMARY KEY (id)
);

-- ==========================================
-- SESSION DOMAIN
-- ==========================================
-- LESSON = Transactional (batch must complete)
CREATE TABLE public.lesson_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  level integer NOT NULL, -- Which curriculum level this batch is for
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE public.lesson_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.lesson_batches(id) ON DELETE CASCADE,
  ku_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unseen' CHECK (status IN ('unseen', 'viewed', 'quiz_passed')),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_lesson_batches_user ON public.lesson_batches(user_id);

-- REVIEW = Atomic (each item independent, for analytics only)
CREATE TABLE public.review_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  total_items integer DEFAULT 0,
  completed_items integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE public.review_session_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  ku_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  facet text NOT NULL CHECK (facet IN ('meaning', 'reading', 'cloze')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'correct', 'incorrect')),
  first_rating text CHECK (first_rating IN ('again', 'good')),
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_review_sessions_user ON public.review_sessions(user_id);
CREATE INDEX idx_review_session_items_session ON public.review_session_items(session_id);

-- ==========================================
-- PROGRESS DOMAIN (FSRS)
-- ==========================================
-- Independence Law: Each facet (meaning, reading, cloze) tracked separately
CREATE TABLE public.user_learning_states (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ku_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  facet text NOT NULL DEFAULT 'meaning' CHECK (facet IN ('meaning', 'reading', 'cloze')),
  state text DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'burned')),
  stability double precision DEFAULT 0, -- Stability in days. Success: S*1.5. Fail: S*0.4.
  difficulty double precision DEFAULT 3.0,
  last_review timestamp with time zone,
  next_review timestamp with time zone DEFAULT now(),
  reps integer DEFAULT 0, -- Increments on success. Fail: max(1, reps - 2).
  lapses integer DEFAULT 0,
  PRIMARY KEY (user_id, ku_id, facet)
);

CREATE INDEX idx_user_learning_states_facet ON public.user_learning_states(user_id, facet);

CREATE TABLE public.user_learning_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ku_id uuid NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  facet text DEFAULT 'meaning',
  rating text NOT NULL,
  stability double precision NOT NULL,
  difficulty double precision NOT NULL,
  interval integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- ==========================================
-- ASSISTANT DOMAIN
-- ==========================================
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text CHECK (role IN ('system', 'user', 'assistant')),
  content text NOT NULL,
  referenced_ku_ids uuid[], -- Linked to KnowledgeUnit
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- ==========================================
-- NOTES
-- ==========================================
-- 1. Levels are VIRTUAL (level-1 to level-60), no levels_meta table.
-- 2. Review is ATOMIC - each correct answer immediately updates FSRS.
-- 3. Lesson is TRANSACTIONAL - batch must complete.
-- 4. user_settings has been REMOVED - defaults managed in app layer.
