-- 1️⃣ Authority Boundaries: Enforce Domain Invariants
-- Only service_role (used by fastapi-domain) may mutate these tables.

ALTER TABLE lesson_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fsrs_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing write policies for authenticated/anon users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
        AND tablename IN ('lesson_batches', 'lesson_items', 'review_sessions', 'review_session_items', 'user_fsrs_states', 'sentence_knowledge', 'decks', 'deck_items', 'agent_jobs', 'user_learning_logs')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- Specifically allow SELECT for authenticated users so UI can query
CREATE POLICY "Allow select for authenticated" ON lesson_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON lesson_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON review_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON review_session_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON user_fsrs_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON sentence_knowledge FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON decks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON deck_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated" ON agent_jobs FOR SELECT TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies created!
-- Bypassed by service_role (which bypasses RLS).
