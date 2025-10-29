-- =========================================================
-- SUPABASE PERFORMANCE OPTIMIZATION: INDEXES
-- =========================================================

-- 1. Indexing columns used in RLS Policies (Rule: rls-add-indexes)
-- These ensure that auth.uid() = user_id queries are lightning fast.

CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id); -- Although PK, explicit index can help in some joined RLS
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_uls_user_id ON public.user_learning_states(user_id);
CREATE INDEX IF NOT EXISTS idx_fsrs_history_user_id ON public.fsrs_history(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_item_interactions_user_id ON public.deck_item_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sentences_user_id ON public.sentences(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_user_id ON public.user_youtube_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.user_daily_stats(user_id);

-- 2. FK Performance & Join Optimization
CREATE INDEX IF NOT EXISTS idx_deck_items_deck_id ON public.deck_items(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_ku_id ON public.deck_items(ku_id);
CREATE INDEX IF NOT EXISTS idx_ku_to_sentence_sentence_id ON public.ku_to_sentence(sentence_id);
CREATE INDEX IF NOT EXISTS idx_uls_ku_id ON public.user_learning_states(ku_id);

-- 3. FSRS SCHEDULING (CRITICAL PERFORMANCE) - Rule: db-indexes-strategy
-- This index is vital for fetching "Cards Due Today". 
-- We include 'user_id' and 'next_review', and filter out 'Burned' cards to keep the index slim.

CREATE INDEX IF NOT EXISTS idx_uls_schedule ON public.user_learning_states(user_id, next_review) 
WHERE state != 'Burned';

-- 4. Search Performance (Rule: text-search-optimization)
CREATE INDEX IF NOT EXISTS idx_ku_search_key_trgm ON public.knowledge_units USING gin (search_key gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sentences_ja_trgm ON public.sentences USING gin (text_ja gin_trgm_ops);
