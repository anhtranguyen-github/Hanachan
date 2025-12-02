
/**
 * Business rules for processing raw YouTube transcripts into learning content.
 */

export interface TranscriptLine {
    text: string;
    start: number;
    duration: number;
}

/**
 * Merges short transcript lines into cohesive sentence blocks.
 * Rule: Merge until a sentence-ending punctuation (。！？) or max duration reached.
 */
export function groupTranscriptLines(lines: TranscriptLine[], maxDuration: number = 5): TranscriptLine[] {
    const result: TranscriptLine[] = [];
    let current: TranscriptLine | null = null;

    for (const line of lines) {
        if (!current) {
            current = { ...line };
        } else {
            const hasEnding = /[。！？]/.test(current.text);
            const tooLong = (line.start + line.duration) - current.start > maxDuration;

            if (hasEnding || tooLong) {
                result.push(current);
                current = { ...line };
            } else {
                current.text += ' ' + line.text;
                current.duration = (line.start + line.duration) - current.start;
            }
        }
    }

    if (current) result.push(current);
    return result;
}

/**
 * Cleans YouTube-specific artifacts from transcript text.
 */
export function cleanTranscriptText(text: string): string {
    return text
        .replace(/\[[^\]]*\]/g, '') // Remove [music], [applause]
        .replace(/\s+/g, ' ')
        .trim();
}
