-- Migration: Add facet column to questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS facet TEXT CHECK (facet IN ('meaning', 'reading', 'cloze'));

-- Add unique constraint to prevent duplicate questions for the same facet (optional but good)
-- ALTER TABLE public.questions ADD CONSTRAINT unique_ku_facet UNIQUE (ku_id, facet);

CREATE INDEX IF NOT EXISTS idx_questions_ku_facet ON public.questions(ku_id, facet);
