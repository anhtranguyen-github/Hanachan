import kuromoji from 'kuromoji';
import path from 'path';

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

export interface Token {
    surface_form: string;
    pos: string;
    pos_detail_1: string;
    pos_detail_2: string;
    pos_detail_3: string;
    conjugated_type: string;
    conjugated_form: string;
    basic_form: string;
    reading: string;
    pronunciation: string;
}

export async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
    if (tokenizer) return tokenizer;

    return new Promise((resolve, reject) => {
        // Typically kuromoji dictionary is in node_modules/kuromoji/dict
        // We need to resolve this path correctly for Next.js server actions
        const dicPath = path.resolve(process.cwd(), 'node_modules', 'kuromoji', 'dict');

        kuromoji.builder({ dicPath }).build((err, _tokenizer) => {
            if (err) {
                reject(err);
            } else {
                tokenizer = _tokenizer;
                resolve(_tokenizer);
            }
        });
    });
}

export async function tokenize(text: string): Promise<Token[]> {
    const tokenizer = await getTokenizer();
    return tokenizer.tokenize(text);
}
