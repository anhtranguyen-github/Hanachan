
/**
 * Simple keyword-based Intent Router (to save AI tokens/latency).
 * In production, this could be a small LLM call, but Regex is faster for now.
 */

export type ChatIntent = 'GREETING' | 'PROJECT_QUERY' | 'SEARCH_KU' | 'GENERAL_CHAT';

export function classifyIntent(text: string): ChatIntent {
    const lower = text.toLowerCase().trim();

    // 1. Knowledge Search
    if (lower.includes('search') || lower.includes('find') || lower.includes('lookup') || lower.includes('là gì')) {
        return 'SEARCH_KU';
    }


    // 2. Project Awareness
    if (lower.includes("project") || lower.includes("stack") || lower.includes("building") || lower.includes("architecture")) {
        return 'PROJECT_QUERY';
    }


    // 3. Greetings
    if (lower.match(/^(hi|hello|konnichiwa|yo|hey)/)) {
        return 'GREETING';
    }

    // Default
    return 'GENERAL_CHAT';
}
