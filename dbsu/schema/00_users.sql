-- ---------------------------------------------------------
-- PART 05: USER MANAGEMENT & SETTINGS
-- ---------------------------------------------------------

-- Basic User table for local environment
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings for Study Personalization
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_new_cards_limit INTEGER DEFAULT 20,
    daily_review_limit INTEGER DEFAULT 100,
    target_retention DOUBLE PRECISION DEFAULT 0.9,
    fsrs_weights DOUBLE PRECISION[] DEFAULT '{0.4, 0.6, 2.4, 5.8, 4.9, 0.4, 0.9, 0.0, 1.5, 0.4, 0.7, 0.8, 0.1, 0.3, 1.5, 0.4, 2.4}',
    preferred_voice TEXT DEFAULT 'Tokyo', -- Accent preference
    theme TEXT DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis History (UC-03.1)
CREATE TABLE IF NOT EXISTS user_analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text_ja TEXT NOT NULL,
    analysis_result JSONB, -- Storing the result for quick revisiting
    created_at TIMESTAMPTZ DEFAULT NOW()
);
