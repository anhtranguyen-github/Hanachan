-- Core Knowledge Base Schema

-- Radicals
CREATE TABLE IF NOT EXISTS radicals (
    id TEXT PRIMARY KEY,
    character TEXT,
    name TEXT,
    slug TEXT,
    level INTEGER,
    meaning TEXT,
    mnemonic TEXT,
    url TEXT,
    image_src TEXT,
    image_alt TEXT,
    kanji_slugs TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Kanji
CREATE TABLE IF NOT EXISTS kanji (
    id TEXT PRIMARY KEY,
    character TEXT,
    level INTEGER,
    url TEXT,
    meanings_json TEXT,
    readings_json TEXT,
    radicals_json TEXT,
    visually_similar_json TEXT,
    amalgamations_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
    id TEXT PRIMARY KEY,
    character TEXT,
    level INTEGER,
    url TEXT,
    meanings_json TEXT,
    readings_json TEXT,
    collocations_json TEXT,
    context_sentences_json TEXT,
    components_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Grammar
CREATE TABLE IF NOT EXISTS grammar (
    id TEXT PRIMARY KEY,
    slug TEXT,
    title TEXT,
    level INTEGER,
    url TEXT,
    meanings_json TEXT,
    structure_json TEXT,
    details_json TEXT,
    about_json TEXT,
    examples_json TEXT,
    related_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_radicals_level ON radicals(level);
CREATE INDEX IF NOT EXISTS idx_kanji_level ON kanji(level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_level ON vocabulary(level);
CREATE INDEX IF NOT EXISTS idx_grammar_level ON grammar(level);
CREATE INDEX IF NOT EXISTS idx_kanji_char ON kanji(character);
CREATE INDEX IF NOT EXISTS idx_vocabulary_char ON vocabulary(character);

-- User Learning State (SRS)
CREATE TABLE IF NOT EXISTS learning_state (
    ku_id TEXT PRIMARY KEY,
    ku_type TEXT NOT NULL,
    srs_level INTEGER DEFAULT 0,
    next_review DATETIME,
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_next_review ON learning_state(next_review);
