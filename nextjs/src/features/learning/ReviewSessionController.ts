
import { Rating, SRSState } from './domain/FSRSEngine';
import { submitReview } from './service';

export interface QuizItem {
    id: string; // Unique ID like "kuId-meaning"
    ku_id: string;
    type: string;
    character: string;
    meaning: string;
    reading?: string;
    prompt_variant: 'meaning' | 'reading' | 'cloze';
    currentState: SRSState;
    originalDoc: any;
    // Cloze specific
    sentence_ja?: string;
    cloze_answer?: string;
}

export class ReviewSessionController {
    private queue: QuizItem[] = [];
    private completedCount = 0;
    private totalItems = 0;
    private userId: string;

    // Tracking facets for buffered persistence
    private pendingFacets: Record<string, Set<string>> = {}; // kuId -> Set of variant names
    private expectedFacets: Record<string, number> = {}; // kuId -> total variant count
    private sessionFailures: Set<string> = new Set(); // Track KUs failed at least once this session

    constructor(userId: string) {
        this.userId = userId;
    }

    async initSession(items: any[]) {
        this.queue = this.transformItems(items);
        this.totalItems = this.queue.length;
        return this.queue;
    }

    private transformItems(items: any[]): QuizItem[] {
        const quizItems: QuizItem[] = [];

        items.forEach(item => {
            const ku = item.knowledge_units;
            if (!ku) return;

            const details = ku.vocabulary_details?.[0] || ku.kanji_details?.[0] || ku.details;
            let reading = "";
            if (ku.type === 'vocabulary') {
                reading = details?.reading || ku.reading || "";
            } else if (ku.type === 'kanji') {
                reading = details?.onyomi?.[0] || details?.kunyomi?.[0] || ku.reading || "";
            }

            const activeVariants: string[] = [];

            if (ku.type === 'grammar') {
                activeVariants.push('cloze');
            } else if (ku.type === 'radical') {
                activeVariants.push('meaning');
            } else {
                // Kanji or Vocab
                activeVariants.push('meaning');
                if (reading) activeVariants.push('reading');
            }

            this.expectedFacets[ku.id] = activeVariants.length;
            this.pendingFacets[ku.id] = new Set();

            activeVariants.forEach(variant => {
                let sentence_ja = ku.grammar_details?.[0]?.sentence_ja || ku.sentence_ja;
                let cloze_answer = ku.grammar_details?.[0]?.cloze_answer || ku.answer || reading;

                // Business Rule: Choose a random example sentence for grammar if available
                if (ku.type === 'grammar' && ku.grammar_details?.[0]?.example_sentences) {
                    const examples = ku.grammar_details[0].example_sentences;
                    if (Array.isArray(examples) && examples.length > 0) {
                        const randomIdx = Math.floor(Math.random() * examples.length);
                        const ex = examples[randomIdx];
                        sentence_ja = ex.ja || sentence_ja;
                        // Use provided cloze or the whole sentence as fallback
                        cloze_answer = ex.cloze_answer || ex.answer || cloze_answer;
                    }
                }

                quizItems.push({
                    id: `${ku.id}-${variant}`,
                    ku_id: ku.id,
                    type: ku.type,
                    character: ku.character,
                    meaning: ku.meaning,
                    reading: variant === 'reading' ? reading : undefined,
                    prompt_variant: variant as any,
                    currentState: {
                        stage: item.state || 'new',
                        stability: item.stability || 0,
                        difficulty: item.difficulty || 3.0,
                        reps: item.reps || 0,
                        lapses: item.lapses || 0
                    },
                    originalDoc: item,
                    sentence_ja,
                    cloze_answer
                });
            });
        });

        // Business Rule: Batch order is FIXED (no random shuffle here)
        return quizItems;
    }

    getNextItem(): QuizItem | null {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    async submitAnswer(rating: Rating): Promise<boolean> {
        const current = this.queue[0];
        if (!current) return false;

        const isSuccess = rating !== 'fail' && rating !== 'again';

        if (isSuccess) {
            // 1. Mark this specific facet as temporarily cleared for this session
            this.pendingFacets[current.ku_id].add(current.prompt_variant);

            // 2. Check if all facets for this KU are now cleared
            const isKUComplete = this.pendingFacets[current.ku_id].size === this.expectedFacets[current.ku_id];

            if (isKUComplete) {
                // Determine final rating: If failed once in session, result is 'fail'
                const finalRating = this.sessionFailures.has(current.ku_id) ? 'fail' : 'pass';

                console.log(`[ReviewSessionController] KU Mastery achieved for ${current.ku_id}. Persisting with rating: ${finalRating}`);
                await submitReview(this.userId, current.ku_id, finalRating, current.currentState);

                // Remove all variants of this KU from the queue
                this.queue = this.queue.filter(item => item.ku_id !== current.ku_id);
            } else {
                // Shift this facet out as it's temporarily solved
                this.queue.shift();
            }
            this.completedCount++;
            return true;
        } else {
            // FAILURE: Log failure for the KU to ensure SRS penalty at the end
            console.log(`[ReviewSessionController] Facet ${current.prompt_variant} failed for ${current.ku_id}. Item re-queued.`);

            // Mark as failed for the whole session
            this.sessionFailures.add(current.ku_id);

            // Re-queue this facet to the end
            const failedItem = this.queue.shift()!;
            this.queue.push(failedItem);

            return false;
        }
    }

    getProgress() {
        return {
            completed: this.completedCount,
            total: this.totalItems,
            queueSize: this.queue.length
        };
    }
}
