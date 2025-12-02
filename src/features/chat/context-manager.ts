
/**
 * Business rules for managing AI conversation context.
 */

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Truncates chat history for AI safety and token efficiency.
 * Rule: Keep the most recent 10 messages.
 */
export function pruneHistory(history: ChatMessage[], limit: number = 10): ChatMessage[] {
    if (history.length <= limit) return history;
    return history.slice(history.length - limit);
}

/**
 * Extracts potential user interests based on keyword frequency.
 */
export function extractInterests(history: ChatMessage[]): string[] {
    const keywords = ['anime', 'food', 'travel', 'music', 'work', 'school'];
    const text = history.map(m => m.content.toLowerCase()).join(' ');

    return keywords.filter(k => text.includes(k));
}
