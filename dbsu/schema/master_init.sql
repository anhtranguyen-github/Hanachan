-- ============================================================================
-- HANACHAN V2 - MASTER INITIALIZATION SQL
-- This file contains the complete database schema including:
-- 1. Extensions & Enums
-- 2. Master Tables (Users, Knowledge Base, Sentences)
-- 3. Learning & RPG Systems (Decks, SRS, History)
-- 4. Extensibility (YouTube, Analysis, Analytics)
-- 5. Supabase Auth Triggers (User Sync)
-- 6. Row Level Security (RLS) Best Practices
-- 7. Optimal Database Indexes (Security & Performance)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUMS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ku_type') THEN
        CREATE TYPE ku_type AS ENUM ('radical', 'kanji', 'vocabulary', 'grammar');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fsrs_state') THEN
        CREATE TYPE fsrs_state AS ENUM ('New', 'Learning', 'Review', 'Relearning', 'Burned');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_state') THEN
        CREATE TYPE interaction_state AS ENUM ('New', 'Seen', 'Learning', 'Mastered');
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. USER SYSTEM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Matches Supabase Auth.uid()
    email TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_new_cards_limit INTEGER DEFAULT 20,
    daily_review_limit INTEGER DEFAULT 100,
    target_retention DOUBLE PRECISION DEFAULT 0.9,
    fsrs_weights DOUBLE PRECISION[] DEFAULT '{0.4, 0.6, 2.4, 5.8, 4.9, 0.4, 0.9, 0.0, 1.5, 0.4, 0.7, 0.8, 0.1, 0.3, 1.5, 0.4, 2.4}',
    preferred_voice TEXT DEFAULT 'Tokyo',
    theme TEXT DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. KNOWLEDGE BASE (CKB)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    type ku_type NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    level INTEGER,
    search_key TEXT,
    search_reading TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ku_radicals (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT,
    image_json JSONB,
    name TEXT NOT NULL,
    meaning_story JSONB,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ku_kanji (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    meaning_data JSONB,
    reading_data JSONB,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ku_vocabulary (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    reading_primary TEXT NOT NULL,
    meaning_data JSONB,
    audio_assets JSONB,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ku_grammar (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meaning_summary TEXT,
    meaning_story JSONB,
    structure_json JSONB,
    metadata JSONB DEFAULT '{}'
);

-- ----------------------------------------------------------------------------
-- 4. SENTENCE SYSTEM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    text_ja TEXT NOT NULL UNIQUE,
    text_en TEXT,
    text_tokens JSONB,
    audio_url TEXT,
    source_type TEXT,
    source_metadata JSONB,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ku_to_sentence (
    ku_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
    sentence_id UUID NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    cloze_positions JSONB,
    PRIMARY KEY (ku_id, sentence_id)
);

-- ----------------------------------------------------------------------------
-- 5. DECKS & RPG PROGRESS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'user_mined',
    level_index INTEGER,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deck_items (
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    ku_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    sentence_id UUID REFERENCES sentences(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, ku_id)
);

CREATE TABLE IF NOT EXISTS deck_item_interactions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    ku_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    state interaction_state DEFAULT 'New',
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, deck_id, ku_id)
);

-- ----------------------------------------------------------------------------
-- 6. SRS (FSRS) SYSTEM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_learning_states (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ku_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
    state fsrs_state DEFAULT 'New',
    stability DOUBLE PRECISION DEFAULT 0,
    difficulty DOUBLE PRECISION DEFAULT 0,
    elapsed_days INTEGER DEFAULT 0,
    scheduled_days INTEGER DEFAULT 0,
    last_review TIMESTAMPTZ,
    next_review TIMESTAMPTZ DEFAULT NOW(),
    lapses INTEGER DEFAULT 0,
    reps INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, ku_id)
);

CREATE TABLE IF NOT EXISTS fsrs_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ku_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    review_at TIMESTAMPTZ DEFAULT NOW(),
    sentence_id UUID REFERENCES sentences(id),
    prev_state fsrs_state,
    prev_stability DOUBLE PRECISION,
    prev_difficulty DOUBLE PRECISION,
    new_stability DOUBLE PRECISION,
    new_difficulty DOUBLE PRECISION,
    elapsed_days INTEGER,
    scheduled_days INTEGER
);

-- ----------------------------------------------------------------------------
-- 7. ADDITIONAL FEATURES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_youtube_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT,
    thumbnail_url TEXT,
    channel_title TEXT,
    status TEXT DEFAULT 'learning',
    last_watched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS user_daily_stats (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    new_cards_learned INTEGER DEFAULT 0,
    cards_reviewed INTEGER DEFAULT 0,
    minutes_spent INTEGER DEFAULT 0,
    success_rate DOUBLE PRECISION,
    PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS user_analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text_ja TEXT NOT NULL,
    analysis_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. AUTH TRIGGER (USER SYNC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url;
        
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_item_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ku_to_sentence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ku_radicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ku_kanji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ku_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ku_grammar ENABLE ROW LEVEL SECURITY;

-- Owner Policies
DROP POLICY IF EXISTS "owner_full_access_users" ON public.users;
CREATE POLICY "owner_full_access_users" ON public.users FOR ALL TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "owner_full_access_settings" ON public.user_settings;
CREATE POLICY "owner_full_access_settings" ON public.user_settings FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_uls" ON public.user_learning_states;
CREATE POLICY "owner_full_access_uls" ON public.user_learning_states FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_history" ON public.fsrs_history;
CREATE POLICY "owner_full_access_history" ON public.fsrs_history FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_decks" ON public.decks;
CREATE POLICY "owner_full_access_decks" ON public.decks FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_interactions" ON public.deck_item_interactions;
CREATE POLICY "owner_full_access_interactions" ON public.deck_item_interactions FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_youtube" ON public.user_youtube_videos;
CREATE POLICY "owner_full_access_youtube" ON public.user_youtube_videos FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_stats" ON public.user_daily_stats;
CREATE POLICY "owner_full_access_stats" ON public.user_daily_stats FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "owner_full_access_analysis" ON public.user_analysis_history;
CREATE POLICY "owner_full_access_analysis" ON public.user_analysis_history FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

-- System Data (Public Read for Authenticated)
DROP POLICY IF EXISTS "read_system_decks" ON public.decks;
CREATE POLICY "read_system_decks" ON public.decks FOR SELECT TO authenticated USING (user_id IS NULL);

DROP POLICY IF EXISTS "read_system_sentences" ON public.sentences;
CREATE POLICY "read_system_sentences" ON public.sentences FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "read_knowledge_units" ON public.knowledge_units;
CREATE POLICY "read_knowledge_units" ON public.knowledge_units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_ku_radicals" ON public.ku_radicals;
CREATE POLICY "read_ku_radicals" ON public.ku_radicals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_ku_kanji" ON public.ku_kanji;
CREATE POLICY "read_ku_kanji" ON public.ku_kanji FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_ku_vocabulary" ON public.ku_vocabulary;
CREATE POLICY "read_ku_vocabulary" ON public.ku_vocabulary FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_ku_grammar" ON public.ku_grammar;
CREATE POLICY "read_ku_grammar" ON public.ku_grammar FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_ku_relations" ON public.ku_to_sentence;
CREATE POLICY "read_ku_relations" ON public.ku_to_sentence FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 10. OPTIMAL INDEXES
-- ----------------------------------------------------------------------------
-- RLS Support Indexes
CREATE INDEX IF NOT EXISTS idx_uls_user_id ON public.user_learning_states(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_sentences_user_id ON public.sentences(user_id);

-- Scheduling Index (The Heavy Lifter for FSRS)
CREATE INDEX IF NOT EXISTS idx_uls_schedule ON public.user_learning_states(user_id, next_review) WHERE state != 'Burned';

-- Japanese Text Search (Trigram)
CREATE INDEX IF NOT EXISTS idx_ku_search_key_trgm ON public.knowledge_units USING gin (search_key gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sentences_ja_trgm ON public.sentences USING gin (text_ja gin_trgm_ops);

-- Joins & Foreign Keys
CREATE INDEX IF NOT EXISTS idx_deck_items_deck_ku ON public.deck_items(deck_id, ku_id);
CREATE INDEX IF NOT EXISTS idx_ku_to_sentence_composite ON public.ku_to_sentence(ku_id, sentence_id);
CREATE INDEX IF NOT EXISTS idx_uls_ku_id ON public.user_learning_states(ku_id);
