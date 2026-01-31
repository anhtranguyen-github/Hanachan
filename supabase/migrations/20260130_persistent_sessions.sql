-- Migration: Implement persistent session tracking
-- Created: 2026-01-30

-- 1. Drop decks and deck_items tables (levels are virtual, based on knowledge_units.level)
DROP TABLE IF EXISTS public.deck_items CASCADE;
DROP TABLE IF EXISTS public.decks CASCADE;

-- 2. Remove user_settings as requested (switching to defaults/level-based logic)
DROP TABLE IF EXISTS public.user_settings;

-- 3. Lesson Batches (Learning discovery persistence)
CREATE TABLE IF NOT EXISTS public.lesson_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level integer NOT NULL,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT lesson_batches_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_batches_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 4. Lesson Items (Individual Knowledge Units in a discovery batch)
CREATE TABLE IF NOT EXISTS public.lesson_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  ku_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'unseen', -- unseen, viewed, quiz_passed
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_items_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_items_batch_fkey FOREIGN KEY (batch_id) REFERENCES public.lesson_batches(id) ON DELETE CASCADE,
  CONSTRAINT lesson_items_ku_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id) ON DELETE CASCADE
);

-- 5. Review Sessions (Persistent state for SRS sessions)
CREATE TABLE IF NOT EXISTS public.review_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, finished
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  total_items integer DEFAULT 0,
  completed_items integer DEFAULT 0,
  CONSTRAINT review_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT review_sessions_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 6. Review Session Items (Trace individual facet progress in a session)
CREATE TABLE IF NOT EXISTS public.review_session_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  ku_id uuid NOT NULL,
  facet text NOT NULL, -- meaning, reading, cloze
  status text NOT NULL DEFAULT 'pending', -- pending, correct, incorrect
  first_rating text, -- again, good, etc.
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_session_items_pkey PRIMARY KEY (id),
  CONSTRAINT review_session_items_session_fkey FOREIGN KEY (session_id) REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  CONSTRAINT review_session_items_ku_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id) ON DELETE CASCADE
);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_batches_user ON public.lesson_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user ON public.review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_session_items_session ON public.review_session_items(session_id);
