
/**
 * Business rules for matching grammar patterns in Japanese text.
 */

export interface GrammarPattern {
    slug: string;
    regex: string;
}

/**
 * Sweeps a sentence for grammar pattern matches.
 * Rules: Longest match wins if overlapping.
 */
export function matchGrammar(text: string, library: GrammarPattern[]): string[] {
    const matches: { slug: string, start: number, end: number }[] = [];

    for (const pattern of library) {
        const re = new RegExp(pattern.regex, 'g');
        let match;
        while ((match = re.exec(text)) !== null) {
            matches.push({
                slug: pattern.slug,
                start: match.index,
                end: match.index + match[0].length
            });
        }
    }

    // Filter overlapping: keep longest
    return matches
        .sort((a, b) => (b.end - b.start) - (a.end - a.start))
        .reduce((acc, curr) => {
            const isOverlapping = acc.some(item =>
                (curr.start >= item.start && curr.start < item.end) ||
                (curr.end > item.start && curr.end <= item.end)
            );
            if (!isOverlapping) acc.push(curr);
            return acc;
        }, [] as typeof matches)
        .map(m => m.slug);
}
