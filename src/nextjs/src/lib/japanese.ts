
/**
 * Japanese text utilities for formatting Furigana and other markers.
 */

/**
 * Converts text with Furigana markers to HTML ruby tags.
 * Supports formats:
 * - 漢字[かんじ]
 * - 漢字（かんじ）
 */
export function formatJapanese(text: string): string {
    if (!text) return '';

    // 1. Handle Kanji[Furigana] format
    let formatted = text.replace(/([一-龠々]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');

    // 2. Handle Kanji（Furigana） format (common in the provided dataset)
    formatted = formatted.replace(/([一-龠々]+)（([^）]+)）/g, '<ruby>$1<rt>$2</rt></ruby>');

    return formatted;
}

/**
 * Strips common HTML tags while keeping basic structure markers
 * Useful for converting the 'about' field if it has simple tags.
 */
export function cleanHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>?/gm, '') // Remove all tags
        .replace(/\n\s*\n/g, '\n\n') // Consolidate newlines
        .trim();
}

/**
 * Formats custom mnemonic markers into styled HTML.
 * <r> -> Radical
 * <k> -> Kanji
 * <v> -> Vocabulary
 */
export function formatMnemonic(text: string): string {
    if (!text) return '';

    return text
        .replace(/<r>(.*?)<\/r>/g, '<mark class="bg-radical/10 text-radical px-1 rounded font-black">$1</mark>')
        .replace(/<k>(.*?)<\/k>/g, '<mark class="bg-kanji/10 text-kanji px-1 rounded font-black">$1</mark>')
        .replace(/<v>(.*?)<\/v>/g, '<mark class="bg-vocab/10 text-vocab px-1 rounded font-black">$1</mark>');
}
