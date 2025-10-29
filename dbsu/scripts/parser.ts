import * as cheerio from 'cheerio';

export type TokenType = 'text' | 'radical' | 'kanji' | 'vocabulary' | 'reading' | 'meaning' | 'emphasis' | 'grammar_ref' | 'cloze';

export interface ContentToken {
    type: TokenType;
    text: string;
    ref_id?: string; // External ID hoặc Group ID từ Bunpro
}

export interface StructuredContent {
    tokens: ContentToken[];
    text_only: string;
}

/**
 * Chuyển đổi HTML từ WaniKani/Bunpro sang định dạng StructuredToken
 * Giúp bỏ HTML nhưng vẫn giữ được logic bôi đậm, highlight và link.
 */
export function parseHTMLToTokens(html: string): StructuredContent {
    if (!html) return { tokens: [], text_only: "" };

    const $ = cheerio.load(html);
    const tokens: ContentToken[] = [];

    // Duyệt qua body để lấy text và tags
    const body = $('body');

    function traverse(node: any) {
        $(node).contents().each((_, child) => {
            if (child.type === 'text') {
                const text = $(child).text();
                if (text) tokens.push({ type: 'text', text });
            } else if (child.type === 'tag') {
                const el = $(child);
                const tagName = child.name;

                let type: TokenType = 'text';
                let ref_id: string | undefined = undefined;

                // Xử lý các class highlight của WaniKani
                if (el.hasClass('radical-highlight')) type = 'radical';
                else if (el.hasClass('kanji-highlight')) type = 'kanji';
                else if (el.hasClass('vocabulary-highlight')) type = 'vocabulary';
                else if (el.hasClass('reading-highlight')) type = 'reading';
                else if (el.hasClass('meaning-highlight')) type = 'meaning';

                // Xử lý Bunpro Grammar Ref
                else if (el.attr('data-gp-id')) {
                    type = 'grammar_ref';
                    ref_id = el.attr('data-gp-id');
                }

                // Xử lý Flashcard Cloze (đục lỗ)
                else if (el.hasClass('study-area-input') || tagName === 'strong') {
                    type = 'cloze';
                }

                // Xử lý nhấn mạnh chung (bold/italic)
                else if (tagName === 'b' || tagName === 'strong' || tagName === 'em' || el.hasClass('prose')) {
                    // Nếu đã là cloze thì giữ cloze, nếu không thì là emphasis
                    if (type !== 'cloze') type = 'emphasis';
                }

                // Đệ quy nếu bên trong còn tag (ví dụ: <strong><mark>...</mark></strong>)
                if (el.children().length > 0 && type === 'text') {
                    traverse(el);
                } else {
                    tokens.push({
                        type,
                        text: el.text(),
                        ...(ref_id && { ref_id })
                    });
                }
            }
        });
    }

    traverse(body);

    // Hợp nhất các token văn bản liên tiếp
    const optimizedTokens: ContentToken[] = [];
    for (const token of tokens) {
        const last = optimizedTokens[optimizedTokens.length - 1];
        if (last && last.type === 'text' && token.type === 'text') {
            last.text += token.text;
        } else {
            optimizedTokens.push(token);
        }
    }

    return {
        tokens: optimizedTokens,
        text_only: optimizedTokens.map(t => t.text).join('')
    };
}

/**
 * Trích xuất vị trí đục lỗ (cloze) để phục vụ cho Flashcard Grammar
 */
export function extractClozePositions(tokens: ContentToken[]): Array<[number, number]> {
    const positions: Array<[number, number]> = [];
    let currentPos = 0;

    for (const token of tokens) {
        if (token.type === 'cloze') {
            positions.push([currentPos, currentPos + token.text.length]);
        }
        currentPos += token.text.length;
    }

    return positions;
}
