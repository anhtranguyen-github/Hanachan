-- ---------------------------------------------------------
-- PART 04: FSRS LEARNING STATES & HISTORY
-- ---------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE fsrs_state AS ENUM ('new', 'learning', 'review', 'relearning', 'burned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trạng thái SRS hiện tại của mỗi KU đối với mỗi User
CREATE TABLE IF NOT EXISTS user_learning_states (
    user_id UUID NOT NULL,
    ku_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
    
    -- FSRS Core Parameters (UC-01.3 & fsrs.md)
    state fsrs_state DEFAULT 'new',
    stability DOUBLE PRECISION DEFAULT 0, -- S: Memory durability in days
    difficulty DOUBLE PRECISION DEFAULT 0,  -- D: Intrinsic difficulty
    
    -- Scheduling
    elapsed_days INTEGER DEFAULT 0,        -- t: Time since last review
    scheduled_days INTEGER DEFAULT 0,      -- i: Interval until next review
    last_review TIMESTAMPTZ,
    next_review TIMESTAMPTZ DEFAULT NOW(),
    
    -- Statistics (UC-06.3)
    lapses INTEGER DEFAULT 0,              -- Number of times forgotten
    reps INTEGER DEFAULT 0,                -- Number of successful reviews
    
    PRIMARY KEY (user_id, ku_id)
);

-- Lịch sử ôn tập chi tiết để AI tối ưu hóa tham số FSRS
CREATE TABLE IF NOT EXISTS fsrs_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ku_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
    
    -- Ghi lại hành động của User
    rating INTEGER NOT NULL, -- 1: Again, 2: Hard, 3: Good, 4: Easy
    review_at TIMESTAMPTZ DEFAULT NOW(),
    sentence_id UUID REFERENCES sentences(id), -- Review này đã dùng câu nào làm context?
    
    -- Ảnh chụp trạng thái FSRS TRƯỚC khi ôn tập
    prev_state fsrs_state,
    prev_stability DOUBLE PRECISION,
    prev_difficulty DOUBLE PRECISION,
    
    -- Kết quả SAU khi ôn tập
    new_stability DOUBLE PRECISION,
    new_difficulty DOUBLE PRECISION,
    elapsed_days INTEGER,
    scheduled_days INTEGER
);

CREATE INDEX IF NOT EXISTS idx_uls_next_review ON user_learning_states(user_id, next_review) WHERE state != 'Burned';
CREATE INDEX IF NOT EXISTS idx_fsrs_history_ku ON fsrs_history(user_id, ku_id);
