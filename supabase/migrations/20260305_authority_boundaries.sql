-- 1. Classify Tables
-- SAFE_DIRECT_WRITE: decks, deck_items, user_learning_logs
-- DOMAIN_CRITICAL: lesson_batches, lesson_items, review_sessions, review_session_items, user_fsrs_states, fsrs_review_logs, agent_jobs

-- 2. Add Structural Constraints (Status Enums, valid states)

-- agent_jobs
DO $$ BEGIN
    ALTER TABLE agent_jobs ADD CONSTRAINT agent_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lesson_batches
DO $$ BEGIN
    ALTER TABLE lesson_batches ADD CONSTRAINT lesson_batches_status_check CHECK (status IN ('in_progress', 'completed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lesson_items
DO $$ BEGIN
    ALTER TABLE lesson_items ADD CONSTRAINT lesson_items_status_check CHECK (status IN ('unseen', 'learning', 'learned'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- review_sessions
DO $$ BEGIN
    ALTER TABLE review_sessions ADD CONSTRAINT review_sessions_status_check CHECK (status IN ('in_progress', 'finished', 'abandoned'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- review_session_items
DO $$ BEGIN
    ALTER TABLE review_session_items ADD CONSTRAINT review_session_items_status_check CHECK (status IN ('pending', 'completed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- fsrs_review_logs
DO $$ BEGIN
    ALTER TABLE fsrs_review_logs ADD CONSTRAINT fsrs_review_logs_rating_check CHECK (rating IN (1, 2, 3, 4));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Enforce RLS Policies

-- Enable RLS
ALTER TABLE lesson_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fsrs_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE fsrs_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('lesson_batches', 'lesson_items', 'review_sessions', 'review_session_items', 'user_fsrs_states', 'fsrs_review_logs', 'agent_jobs', 'decks', 'deck_items', 'user_learning_logs')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- lesson_batches
CREATE POLICY "Select lesson_batches" ON lesson_batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert lesson_batches" ON lesson_batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update lesson_batches" ON lesson_batches FOR UPDATE USING (auth.uid() = user_id);

-- lesson_items
CREATE POLICY "Select lesson_items" ON lesson_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM lesson_batches lb WHERE lb.id = batch_id AND lb.user_id = auth.uid())
);
CREATE POLICY "Insert lesson_items" ON lesson_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM lesson_batches lb WHERE lb.id = batch_id AND lb.user_id = auth.uid())
);
CREATE POLICY "Update lesson_items" ON lesson_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM lesson_batches lb WHERE lb.id = batch_id AND lb.user_id = auth.uid())
);

-- review_sessions
CREATE POLICY "Select review_sessions" ON review_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert review_sessions" ON review_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update review_sessions" ON review_sessions FOR UPDATE USING (auth.uid() = user_id);

-- review_session_items
CREATE POLICY "Select review_session_items" ON review_session_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM review_sessions rs WHERE rs.id = session_id AND rs.user_id = auth.uid())
);
CREATE POLICY "Insert review_session_items" ON review_session_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM review_sessions rs WHERE rs.id = session_id AND rs.user_id = auth.uid())
);
CREATE POLICY "Update review_session_items" ON review_session_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM review_sessions rs WHERE rs.id = session_id AND rs.user_id = auth.uid())
);

-- user_fsrs_states
CREATE POLICY "Select user_fsrs_states" ON user_fsrs_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert user_fsrs_states" ON user_fsrs_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update user_fsrs_states" ON user_fsrs_states FOR UPDATE USING (auth.uid() = user_id);

-- fsrs_review_logs
CREATE POLICY "Select fsrs_review_logs" ON fsrs_review_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert fsrs_review_logs" ON fsrs_review_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- agent_jobs
CREATE POLICY "Select agent_jobs" ON agent_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert agent_jobs" ON agent_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update agent_jobs" ON agent_jobs FOR UPDATE USING (auth.uid() = user_id);

-- decks
CREATE POLICY "Select decks" ON decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert decks" ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update decks" ON decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete decks" ON decks FOR DELETE USING (auth.uid() = user_id);

-- deck_items
CREATE POLICY "Select deck_items" ON deck_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
);
CREATE POLICY "Insert deck_items" ON deck_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
);
CREATE POLICY "Delete deck_items" ON deck_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM decks d WHERE d.id = deck_id AND d.user_id = auth.uid())
);

-- user_learning_logs
CREATE POLICY "Select user_learning_logs" ON user_learning_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert user_learning_logs" ON user_learning_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
