-- ---------------------------------------------------------
-- PART 03: DECKS & MINING (USER ACTION)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- NULL = System decks
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'user_mined', -- 'system', 'user_mined', 'video_based'
    level_index INTEGER, -- For 60 levels organization
    category TEXT, -- 'Kanji', 'Grammar', 'Topic A', ...
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name)
);

-- "Bỏ túi" (Mining Action)
CREATE TABLE IF NOT EXISTS deck_items (
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    ku_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    sentence_id UUID REFERENCES sentences(id), -- Thẻ card này học với câu nào?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, ku_id)
);

CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_items_deck_id ON deck_items(deck_id);
