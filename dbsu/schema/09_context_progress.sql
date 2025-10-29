-- ---------------------------------------------------------
-- PART 09: DECK-SPECIFIC PROGRESS (LOCAL CONTEXT)
-- ---------------------------------------------------------

CREATE TYPE interaction_state AS ENUM ('New', 'Seen', 'Learning', 'Mastered');

CREATE TABLE IF NOT EXISTS deck_item_interactions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    ku_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    
    -- Tiến độ cụ thể của ngữ cảnh này
    state interaction_state DEFAULT 'New',
    last_interaction_at TIMESTAMPTZ,
    interaction_count INTEGER DEFAULT 0,
    
    -- Rating riêng cho ngữ cảnh này (để biết user có gặp khó với câu này không)
    local_difficulty_score DOUBLE PRECISION DEFAULT 0, 

    PRIMARY KEY (user_id, deck_id, ku_id)
);

CREATE INDEX IF NOT EXISTS idx_dii_deck_state ON deck_item_interactions(deck_id, state);
