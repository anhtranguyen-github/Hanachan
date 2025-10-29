-- =========================================================
-- SUPABASE SECURITY HOTFIX: ENABLE RLS & POLICIES
-- Created to address Linter "RLS Disabled in Public" errors.
-- =========================================================

-- 1. Enable RLS on all identified vulnerable tables
ALTER TABLE IF EXISTS public.knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ku_radicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ku_kanji ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ku_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ku_grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ku_to_sentence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deck_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_daily_stats ENABLE ROW LEVEL SECURITY;

-- 2. Establish Access Policies (Best Practice: rls-restrictive-policies)

-- SYSTEM DATA: Publicly readable for authenticated users (Read-only)
DROP POLICY IF EXISTS "Allow public read for auth users" ON public.knowledge_units;
CREATE POLICY "Allow public read for auth users" ON public.knowledge_units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read for auth users" ON public.ku_radicals;
CREATE POLICY "Allow public read for auth users" ON public.ku_radicals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read for auth users" ON public.ku_kanji;
CREATE POLICY "Allow public read for auth users" ON public.ku_kanji FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read for auth users" ON public.ku_vocabulary;
CREATE POLICY "Allow public read for auth users" ON public.ku_vocabulary FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read for auth users" ON public.ku_grammar;
CREATE POLICY "Allow public read for auth users" ON public.ku_grammar FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read for auth users" ON public.ku_to_sentence;
CREATE POLICY "Allow public read for auth users" ON public.ku_to_sentence FOR SELECT TO authenticated USING (true);

-- USER DATA: Strict ownership (Only owner can read/write)
DROP POLICY IF EXISTS "Users can manage their own sentences" ON public.sentences;
CREATE POLICY "Users can manage their own sentences" ON public.sentences 
    FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view system sentences" ON public.sentences;
CREATE POLICY "Users can view system sentences" ON public.sentences 
    FOR SELECT TO authenticated USING (user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage their own youtube videos" ON public.user_youtube_videos;
CREATE POLICY "Users can manage their own youtube videos" ON public.user_youtube_videos 
    FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own daily stats" ON public.user_daily_stats;
CREATE POLICY "Users can manage their own daily stats" ON public.user_daily_stats 
    FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own deck items" ON public.deck_items;
CREATE POLICY "Users can manage their own deck items" ON public.deck_items 
    FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.decks WHERE id = deck_id AND user_id = (SELECT auth.uid()))
    );
