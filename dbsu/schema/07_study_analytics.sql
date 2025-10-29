-- ---------------------------------------------------------
-- PART 07: STUDY ANALYTICS (UC-06.4)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_daily_stats (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    new_cards_learned INTEGER DEFAULT 0,
    cards_reviewed INTEGER DEFAULT 0,
    minutes_spent INTEGER DEFAULT 0,
    success_rate DOUBLE PRECISION,
    PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_day ON user_daily_stats(day);
