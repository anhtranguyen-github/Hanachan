
export interface SentenceEntity {
    id: string;
    text_ja: string;
    text_en?: string;
    source_type: 'youtube' | 'chat' | 'manual';
    source_id?: string;
    timestamp?: number;
    user_id: string;
    created_at: string;
    updated_at?: string;
}

export interface KUToSentenceEntity {
    ku_id: string;
    sentence_id: string;
    is_primary: boolean;
    cloze_positions?: any;
}
