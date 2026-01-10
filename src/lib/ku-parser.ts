// @ts-nocheck
import { clsx } from "clsx";

export type TokenType = 'text' | 'radical' | 'kanji' | 'vocabulary' | 'reading' | 'meaning' | 'emphasis' | 'grammar_ref' | 'cloze';

export interface ContentToken {
    type: TokenType;
    text: string;
    ref_id?: string;
}

export interface StructuredContent {
    tokens: ContentToken[];
    text_only: string;
}

export function parseHTMLToTokens(html: string): StructuredContent {
    if (!html) return { tokens: [], text_only: "" };

    if (typeof window === 'undefined') {
        return {
            tokens: [{ type: 'text', text: html.replace(/<[^>]*>?/gm, '') }],
            text_only: html.replace(/<[^>]*>?/gm, '')
        };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const tokens: ContentToken[] = [];

    function traverse(node: Node) {
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent;
                if (text) tokens.push({ type: 'text', text });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as Element;
                const tagName = el.tagName.toLowerCase();
                let type: TokenType = 'text';
                let ref_id: string | undefined = undefined;

                if (el.classList.contains('radical-highlight')) type = 'radical';
                else if (el.classList.contains('kanji-highlight')) type = 'kanji';
                else if (el.classList.contains('vocabulary-highlight')) type = 'vocabulary';
                else if (el.classList.contains('reading-highlight')) type = 'reading';
                else if (el.classList.contains('meaning-highlight')) type = 'meaning';
                else if (el.getAttribute('data-gp-id')) {
                    type = 'grammar_ref';
                    ref_id = el.getAttribute('data-gp-id') || undefined;
                }
                else if (el.classList.contains('study-area-input') || tagName === 'strong') {
                    type = 'cloze';
                }
                else if (tagName === 'b' || tagName === 'strong' || tagName === 'em' || el.classList.contains('prose')) {
                    if (type !== 'cloze') type = 'emphasis';
                }

                if (el.childNodes.length > 0 && type === 'text') {
                    traverse(el);
                } else {
                    tokens.push({
                        type,
                        text: el.textContent || '',
                        ...(ref_id && { ref_id })
                    });
                }
            }
        });
    }

    traverse(body);

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
