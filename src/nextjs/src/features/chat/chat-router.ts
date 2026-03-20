
/**
 * Simple keyword-based Intent Router (to save AI tokens/latency).
 * In production, this could be a small LLM call, but Regex is faster for now.
 */

export type ChatIntent = 'GREETING' | 'PROJECT_QUERY' | 'SEARCH_KU' | 'GENERAL_CHAT' | 'ANALYZE' | 'STUDY_REQUEST' | 'SRS_SESSION';

export function classifyIntent(text: string): ChatIntent {
    const lower = text.toLowerCase().trim();

    // 1. Check for Analysis Request (Japanese characters or keywords)
    const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
    const startsWithAnalyze = lower.startsWith("analyze") || lower.startsWith("explain") || lower.startsWith("breakdown");

    // Explicit analyze request
    if (startsWithAnalyze && hasJapanese) {
        return 'ANALYZE';
    }

    // Direct Japanese sentence input (assumption: if mostly JP and NOT a common English question starter)
    const isQuestion = lower.match(/^(what|who|where|when|why|how|tell|tell me)/);
    if (hasJapanese && text.length > 2 && text.length < 100 && !isQuestion) {
        // If it's pure Japanese or very short JP-heavy sentence, ANALYZE it.
        // But if it has "Who am I", it's GENERAL_CHAT.
        return 'ANALYZE';
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
