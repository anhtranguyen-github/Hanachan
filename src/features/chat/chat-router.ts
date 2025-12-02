
/**
 * Business rules for classifying user intent in the Hana AI Tutor.
 */

export type ChatIntent =
    | 'GENERAL_QUERY'      // Ask about Japanese or the app
    | 'SENTENCE_ANALYSIS'  // Request to break down a sentence
    | 'STUDY_PRACTICE'     // Request for quiz or conversion practice
    | 'LESSON_SUGGESTION'  // Ask what to learn next
    | 'CONTENT_SEARCH';    // Search for KUs or videos

/**
 * Classifies the user's message into an intent.
 * Note: In production, this would be an LLM call or regex-based router.
 * This domain logic defines the routing rules.
 */
export function classifyIntent(message: string): ChatIntent {
    const text = message.toLowerCase();

    if (text.includes('analyze') || text.includes('break down') || text.includes('analysis') || text.includes('phân tích')) {
        return 'SENTENCE_ANALYSIS';
    }

    if (text.includes('practice') || text.includes('quiz') || text.includes('test') || text.includes('luyện tập')) {
        return 'STUDY_PRACTICE';
    }

    if (text.includes('suggest') || text.includes('should i learn') || text.includes('next level') || text.includes('đề xuất')) {
        return 'LESSON_SUGGESTION';
    }

    if (text.includes('search') || text.includes('find') || text.includes('tìm kiếm')) {
        return 'CONTENT_SEARCH';
    }

    return 'GENERAL_QUERY';
}
