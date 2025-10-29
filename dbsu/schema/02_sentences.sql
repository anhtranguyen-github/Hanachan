-- ---------------------------------------------------------
-- PART 02: SENTENCE SYSTEM
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL, -- NULL = System sentence
    text_ja TEXT NOT NULL,
    text_en TEXT,
    text_tokens JSONB, -- Phân tích Tokenized & Furigana
    audio_url TEXT,
    source_type TEXT, -- 'wanikani', 'bunpro', 'youtube', 'mined'
    source_metadata JSONB, -- {video_id, timestamp, context_url}
    is_verified BOOLEAN DEFAULT true, -- UC-03.5: AI Refinement status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link KU to Sentences with Cloze data
CREATE TABLE IF NOT EXISTS ku_to_sentence (
    ku_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
    sentence_id UUID NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Static 60-level examples
    cloze_positions JSONB, -- [[start, end], ...] for Flashcards
    PRIMARY KEY (ku_id, sentence_id)
);

CREATE INDEX IF NOT EXISTS idx_sentences_text_ja ON sentences USING gin (text_ja gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kts_ku_id ON ku_to_sentence(ku_id);
