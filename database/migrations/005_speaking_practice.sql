-- ==========================================================
-- SPEAKING PRACTICE MODULE - MIGRATION 005
-- Created: 2026-02-28
-- ==========================================================
-- Tables: speaking_sessions, speaking_attempts
-- ==========================================================

-- ==========================================
-- SPEAKING SESSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.speaking_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  difficulty text DEFAULT 'N5',
  current_index integer DEFAULT 0,
  total_sentences integer DEFAULT 0,
  sentences jsonb NOT NULL DEFAULT '[]', -- JSON snapshot of sentences for this session
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_speaking_sessions_user ON public.speaking_sessions(user_id);

-- ==========================================
-- SPEAKING ATTEMPTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.speaking_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.speaking_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sentence text NOT NULL,
  word text NOT NULL,
  score integer DEFAULT 0,
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_speaking_attempts_session ON public.speaking_attempts(session_id);
CREATE INDEX idx_speaking_attempts_user ON public.speaking_attempts(user_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_attempts ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can manage their own speaking sessions"
  ON public.speaking_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own speaking attempts"
  ON public.speaking_attempts FOR ALL USING (auth.uid() = user_id);
