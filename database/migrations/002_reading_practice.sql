-- ==========================================================
-- READING PRACTICE MODULE - MIGRATION 002
-- Created: 2026-02-28
-- ==========================================================
-- Tables: reading_configs, reading_sessions, reading_exercises,
--         reading_answers, reading_metrics
-- ==========================================================

-- ==========================================
-- READING CONFIGURATION (per user)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reading_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Session settings
  exercises_per_session integer DEFAULT 5 CHECK (exercises_per_session BETWEEN 1 AND 20),
  time_limit_minutes integer DEFAULT 15 CHECK (time_limit_minutes BETWEEN 1 AND 60),
  -- Content settings
  difficulty_level text DEFAULT 'adaptive' CHECK (difficulty_level IN ('N5', 'N4', 'N3', 'N2', 'N1', 'adaptive')),
  jlpt_target integer CHECK (jlpt_target BETWEEN 1 AND 5),
  -- Distribution settings (must sum to 100)
  vocab_weight integer DEFAULT 40 CHECK (vocab_weight BETWEEN 0 AND 100),
  grammar_weight integer DEFAULT 30 CHECK (grammar_weight BETWEEN 0 AND 100),
  kanji_weight integer DEFAULT 30 CHECK (kanji_weight BETWEEN 0 AND 100),
  -- Advanced settings
  include_furigana boolean DEFAULT true,
  include_translation boolean DEFAULT false,
  passage_length text DEFAULT 'medium' CHECK (passage_length IN ('short', 'medium', 'long')),
  topic_preferences text[] DEFAULT ARRAY['daily_life', 'culture', 'nature'],
  auto_generate boolean DEFAULT true,
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id)
);

-- ==========================================
-- READING SESSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  config_snapshot jsonb NOT NULL DEFAULT '{}', -- Snapshot of config at session creation
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'abandoned')),
  total_exercises integer DEFAULT 0,
  completed_exercises integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,
  score integer DEFAULT 0, -- 0-100
  -- Auto-generation metadata
  generated_by text DEFAULT 'reading-creator' CHECK (generated_by IN ('reading-creator', 'manual')),
  generation_context jsonb DEFAULT '{}', -- What user learning data was used
  -- Timestamps
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_reading_sessions_user ON public.reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_status ON public.reading_sessions(user_id, status);

-- ==========================================
-- READING EXERCISES (individual passages + questions)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reading_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.reading_sessions(id) ON DELETE CASCADE,
  -- Passage content
  passage_ja text NOT NULL,
  passage_furigana text, -- Passage with furigana annotations (JSON or HTML)
  passage_en text, -- English translation
  passage_title text,
  -- Metadata
  difficulty_level text DEFAULT 'N3',
  jlpt_level integer,
  topic text,
  word_count integer DEFAULT 0,
  -- Vocabulary used (linked to knowledge_units)
  featured_vocab_ids uuid[] DEFAULT '{}',
  featured_grammar_ids uuid[] DEFAULT '{}',
  featured_kanji_ids uuid[] DEFAULT '{}',
  -- Questions
  questions jsonb NOT NULL DEFAULT '[]', -- Array of question objects
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  time_spent_seconds integer DEFAULT 0,
  order_index integer DEFAULT 0,
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_reading_exercises_session ON public.reading_exercises(session_id);

-- ==========================================
-- READING ANSWERS (per question)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reading_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.reading_exercises(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.reading_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_index integer NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'comprehension')),
  user_answer text,
  correct_answer text NOT NULL,
  is_correct boolean DEFAULT false,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_reading_answers_exercise ON public.reading_answers(exercise_id);
CREATE INDEX idx_reading_answers_user ON public.reading_answers(user_id);

-- ==========================================
-- READING METRICS (aggregated per day)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reading_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  sessions_completed integer DEFAULT 0,
  exercises_completed integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  total_answers integer DEFAULT 0,
  avg_score numeric(5,2) DEFAULT 0,
  words_read integer DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_reading_metrics_user ON public.reading_metrics(user_id, date);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.reading_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can manage their own reading configs"
  ON public.reading_configs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reading sessions"
  ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reading exercises"
  ON public.reading_exercises FOR ALL
  USING (session_id IN (SELECT id FROM public.reading_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own reading answers"
  ON public.reading_answers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reading metrics"
  ON public.reading_metrics FOR ALL USING (auth.uid() = user_id);
