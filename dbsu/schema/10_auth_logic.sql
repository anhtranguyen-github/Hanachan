-- =========================================================
-- SUPABASE AUTH BEST PRACTICES: USER SYNCHRONIZATION
-- =========================================================

-- This trigger automatically creates a record in public.users 
-- when a new user signs up via Supabase Auth.

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
        
    -- Khởi tạo mặc định cho User Settings (Best practice: Profile & Settings logic)
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) - The Foundation of Security
-- =========================================================

-- =========================================================
-- ROW LEVEL SECURITY (RLS) - The Foundation of Security
-- =========================================================

-- 1. Enable RLS on ALL tables (Best practice: rls-always-enable)
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

-- 2. User Profile & Settings (Strict ownership)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users 
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users 
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings 
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 3. Learning Data (Strict ownership)
DROP POLICY IF EXISTS "Users can manage their own learning states" ON public.user_learning_states;
CREATE POLICY "Users can manage their own learning states" ON public.user_learning_states 
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own history" ON public.fsrs_history;
CREATE POLICY "Users can manage their own history" ON public.fsrs_history 
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 4. Decks & Interactions
DROP POLICY IF EXISTS "Users can manage their own decks" ON public.decks;
CREATE POLICY "Users can manage their own decks" ON public.decks 
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "System decks are public" ON public.decks;
CREATE POLICY "System decks are public" ON public.decks 
    FOR SELECT TO authenticated USING (user_id IS NULL);

DROP POLICY IF EXISTS "Users can manage their own interactions" ON public.deck_item_interactions;
CREATE POLICY "Users can manage their own interactions" ON public.deck_item_interactions 
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 5. Sentences (System + User Mined)
DROP POLICY IF EXISTS "Users can view system or their own sentences" ON public.sentences;
CREATE POLICY "Users can view system or their own sentences" ON public.sentences 
    FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own sentences" ON public.sentences;
CREATE POLICY "Users can manage their own sentences" ON public.sentences 
    FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()));

-- 6. Knowledge Units (Public Read-Only)
DROP POLICY IF EXISTS "Authenticated users can view knowledge base" ON public.knowledge_units;
CREATE POLICY "Authenticated users can view knowledge base" ON public.knowledge_units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view radical details" ON public.ku_radicals;
CREATE POLICY "Authenticated users can view radical details" ON public.ku_radicals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view kanji details" ON public.ku_kanji;
CREATE POLICY "Authenticated users can view kanji details" ON public.ku_kanji FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view vocab details" ON public.ku_vocabulary;
CREATE POLICY "Authenticated users can view vocab details" ON public.ku_vocabulary FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view grammar details" ON public.ku_grammar;
CREATE POLICY "Authenticated users can view grammar details" ON public.ku_grammar FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view KU relations" ON public.ku_to_sentence;
CREATE POLICY "Authenticated users can view KU relations" ON public.ku_to_sentence FOR SELECT TO authenticated USING (true);

-- 7. Extensions
DROP POLICY IF EXISTS "Users can manage their own youtube videos" ON public.user_youtube_videos;
CREATE POLICY "Users can manage their own youtube videos" ON public.user_youtube_videos FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own daily stats" ON public.user_daily_stats;
CREATE POLICY "Users can manage their own daily stats" ON public.user_daily_stats FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own analysis history" ON public.user_analysis_history;
CREATE POLICY "Users can manage their own analysis history" ON public.user_analysis_history FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id);
