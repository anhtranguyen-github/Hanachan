-- ---------------------------------------------------------
-- PART 08: DATA INTEGRITY (FOREIGN KEYS TO USERS)
-- ---------------------------------------------------------

-- Adding references to the 'users' table created in 00_users.sql
-- These ensure that user logs and learning states are tied to a valid user.

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sentences_user') THEN
        ALTER TABLE sentences ADD CONSTRAINT fk_sentences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_decks_user') THEN
        ALTER TABLE decks ADD CONSTRAINT fk_decks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_uls_user') THEN
        ALTER TABLE user_learning_states ADD CONSTRAINT fk_uls_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_history_user') THEN
        ALTER TABLE fsrs_history ADD CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;
