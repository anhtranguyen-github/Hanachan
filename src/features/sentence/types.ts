export interface Sentence {
    id: string;
    user_id?: string | null;
    text_ja: string;
    text_en?: string | null;
    text_tokens?: any | null;
    audio_url?: string | null;
    source_type?: string | null;
    source_metadata?: any | null;
    is_verified?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface KUToSentence {
    ku_id: string;
    sentence_id: string;
    is_primary: boolean;
    cloze_positions?: any | null;
}
