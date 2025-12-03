
import kuromoji from 'kuromoji';
import path from 'path';

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

let builder: kuromoji.TokenizerBuilder<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;
let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

/**
 * Initializes the kuromoji tokenizer.
 * In Next.js, the dict path must be accessible.
 */
export async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
    if (tokenizer) return tokenizer;

    return new Promise((resolve, reject) => {
        // Path to dict files – relative to the project root or absolute
        // Usually: node_modules/kuromoji/dict
        const dictPath = path.resolve(process.cwd(), 'node_modules/kuromoji/dict');

        kuromoji.builder({ dicPath: dictPath }).build((err, _tokenizer) => {
            if (err) {
                console.error('Kuromoji Initialization Error:', err);
                reject(err);
                return;
            }
            tokenizer = _tokenizer;
            resolve(tokenizer);
        });
    });
}

/**
 * High-level tokenize function.
 */
export async function tokenize(text: string): Promise<KuromojiToken[]> {
    const t = await getTokenizer();
    return t.tokenize(text) as KuromojiToken[];
}
