-- Migration: Add decks and deck_items tables
-- Created: 2026-01-27
-- Purpose: Enable deck-based organization of flashcards for SRS study

-- ============================================
-- TABLE: decks
-- ============================================
-- Stores both system-generated level decks and user-created custom decks

CREATE TABLE IF NOT EXISTS public.decks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  deck_type text NOT NULL DEFAULT 'user' CHECK (deck_type IN ('system', 'user', 'user_mined')),
  level integer,
  owner_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT decks_pkey PRIMARY KEY (id),
  CONSTRAINT decks_owner_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_decks_owner ON public.decks(owner_id);
CREATE INDEX IF NOT EXISTS idx_decks_type ON public.decks(deck_type);
CREATE INDEX IF NOT EXISTS idx_decks_level ON public.decks(level);

-- ============================================
-- TABLE: deck_items
-- ============================================
-- Bridge table connecting decks to their content (KUs or Cloze cards)

CREATE TABLE IF NOT EXISTS public.deck_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL,
  ku_id uuid,
  cloze_id uuid,
  position integer DEFAULT 0,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deck_items_pkey PRIMARY KEY (id),
  CONSTRAINT deck_items_deck_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE,
  CONSTRAINT deck_items_ku_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
  CONSTRAINT deck_items_cloze_fkey FOREIGN KEY (cloze_id) REFERENCES public.cloze_sentence_cards(id) ON DELETE CASCADE,
  -- Ensure at least one of ku_id or cloze_id is set
  CONSTRAINT deck_items_has_content CHECK (ku_id IS NOT NULL OR cloze_id IS NOT NULL)
);

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_deck_items_ku_unique ON public.deck_items(deck_id, ku_id) WHERE ku_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_deck_items_cloze_unique ON public.deck_items(deck_id, cloze_id) WHERE cloze_id IS NOT NULL;

-- Index for deck content queries
CREATE INDEX IF NOT EXISTS idx_deck_items_deck ON public.deck_items(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_ku ON public.deck_items(ku_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.decks IS 'Study decks containing KUs and cloze cards. System decks are auto-generated per level.';
COMMENT ON TABLE public.deck_items IS 'Bridge table linking decks to their flashcard content (KU or Cloze).';
COMMENT ON COLUMN public.decks.deck_type IS 'system=level-based, user=custom, user_mined=from sentence mining';
COMMENT ON COLUMN public.decks.level IS 'For system decks, indicates the WaniKani level (1-60)';
