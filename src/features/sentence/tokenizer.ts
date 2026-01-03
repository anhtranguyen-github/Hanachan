
export interface KuromojiToken {
    surface_form: string;
    pos: string;
    pos_detail_1: string;
    pos_detail_2: string;
    pos_detail_3: string;
    conjugated_type: string;
    conjugated_form: string;
    basic_form: string;
    reading?: string;
    pronunciation?: string;
}

// Mock implementation to avoid heavyweight 'kuromoji' dicts and Node dependencies
export async function getTokenizer(): Promise<any> {
    return {
        tokenize: (text: string) => {
            // Simple mock tokenizer that splits by spaces
            // In a real app with 'kuromoji', this would use the dict.
            // For strictly UI dev without backend/heavy deps, we simulate tokens.
            return text.split(/(\s+)/).map(t => ({
                surface_form: t,
                pos: 'noun', // Dummy logic
                pos_detail_1: '一般',
                pos_detail_2: '*',
                pos_detail_3: '*',
                conjugated_type: '*',
                conjugated_form: '*',
                basic_form: t,
                reading: t,
                pronunciation: t
            }));
        }
    };
}

export async function tokenize(text: string): Promise<KuromojiToken[]> {
    const t = await getTokenizer();
    return t.tokenize(text) as KuromojiToken[];
}
