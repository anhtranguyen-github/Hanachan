-- ==========================================================
-- MIGRATION 20260303_custom_decks: Custom User Decks
-- Created: 2026-03-03
-- Features: Custom deck creation, item management (KU, sentence, video)
-- ==========================================================

-- ==========================================
-- HELPERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- DECKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.decks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- ==========================================
-- DECK ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.deck_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('ku', 'sentence', 'video')),
  created_at timestamp with time zone DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (deck_id, item_id, item_type)
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_decks_user ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_deck ON public.deck_items(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_item ON public.deck_items(item_id, item_type);

-- ==========================================
-- TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS update_decks_updated_at ON public.decks;
CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON public.decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- NOTES
-- ==========================================
-- 1. Custom decks allow users to group any learnable items.
-- 2. deck_items uses a generic item_id and item_type to support multiple content types.
-- 3. The UNIQUE constraint ensures an item isn't added to the same deck twice.
