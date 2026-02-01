-- Add status column to lesson_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_items' AND column_name = 'status') THEN
        ALTER TABLE lesson_items ADD COLUMN status VARCHAR(255) DEFAULT 'unseen';
    END IF;
END $$;

-- Ensure lesson_batches has level column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_batches' AND column_name = 'level') THEN
        ALTER TABLE lesson_batches ADD COLUMN level INTEGER;
    END IF;
END $$;

-- Ensure review_sessions has progress columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_sessions' AND column_name = 'total_items') THEN
        ALTER TABLE review_sessions ADD COLUMN total_items INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_sessions' AND column_name = 'completed_items') THEN
        ALTER TABLE review_sessions ADD COLUMN completed_items INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review_sessions' AND column_name = 'completed_at') THEN
        ALTER TABLE review_sessions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
