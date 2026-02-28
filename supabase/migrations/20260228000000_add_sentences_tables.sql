CREATE TABLE IF NOT EXISTS public.sentences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    japanese_raw TEXT NOT NULL,
    japanese_html TEXT,
    english_raw TEXT NOT NULL,
    english_html TEXT,
    audio_url TEXT,
    source VARCHAR(50) DEFAULT 'system',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sentence_knowledge (
    sentence_id UUID REFERENCES public.sentences(id) ON DELETE CASCADE,
    ku_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    position_start INT,
    position_end INT,
    PRIMARY KEY (sentence_id, ku_id)
);

CREATE TABLE IF NOT EXISTS public.sentence_tags (
    sentence_id UUID REFERENCES public.sentences(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    PRIMARY KEY (sentence_id, tag_name)
);

-- RLS policies
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentence_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentence_tags ENABLE ROW LEVEL SECURITY;

-- Sentences policies
CREATE POLICY "Public sentences are viewable by everyone" ON public.sentences
    FOR SELECT USING (source = 'system' OR created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Users can insert their own sentences" ON public.sentences
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sentences" ON public.sentences
    FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own sentences" ON public.sentences
    FOR DELETE USING (auth.uid() = created_by);

-- Sentence knowledge policies
CREATE POLICY "Public sentence knowledge is viewable by everyone" ON public.sentence_knowledge
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sentences s
            WHERE s.id = sentence_id AND (s.source = 'system' OR s.created_by = auth.uid() OR s.created_by IS NULL)
        )
    );

CREATE POLICY "Users can link knowledge to their own sentences" ON public.sentence_knowledge
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sentences s
            WHERE s.id = sentence_id AND s.created_by = auth.uid()
        )
    );

-- Sentence tags policies
CREATE POLICY "Sentence tags are viewable by everyone who can view the sentence" ON public.sentence_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sentences s
            WHERE s.id = sentence_id AND (s.source = 'system' OR s.created_by = auth.uid() OR s.created_by IS NULL)
        )
    );

CREATE POLICY "Users can add their own tags" ON public.sentence_tags
    FOR ALL USING (auth.uid() = user_id);
