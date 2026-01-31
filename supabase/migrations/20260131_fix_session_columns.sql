
-- Migration: Fix missing columns in persistent session tables
-- Created: 2026-01-31

-- 1. Fix lesson_batches
DO $$
BEGIN
    -- Add columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_batches' AND column_name = 'level') THEN
        ALTER TABLE public.lesson_batches ADD COLUMN level integer NOT NULL DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_batches' AND column_name = 'completed_at') THEN
        ALTER TABLE public.lesson_batches ADD COLUMN completed_at timestamp with time zone;
    END IF;
END $$;

-- 2. Fix review_sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_sessions' AND column_name = 'total_items') THEN
        ALTER TABLE public.review_sessions ADD COLUMN total_items integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_sessions' AND column_name = 'completed_items') THEN
        ALTER TABLE public.review_sessions ADD COLUMN completed_items integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_sessions' AND column_name = 'completed_at') THEN
        ALTER TABLE public.review_sessions ADD COLUMN completed_at timestamp with time zone;
    END IF;
END $$;

-- 3. Ensure review_session_items exists (it might be missing or named differently)
-- From previous \dt, I saw 'review_items'. I should rename it or ensure review_session_items is used.
-- The code uses 'review_session_items'.
CREATE TABLE IF NOT EXISTS public.review_session_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  ku_id uuid NOT NULL,
  facet text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  first_rating text,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_session_items_pkey PRIMARY KEY (id),
  CONSTRAINT review_session_items_session_fkey FOREIGN KEY (session_id) REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  CONSTRAINT review_session_items_ku_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id) ON DELETE CASCADE
);
