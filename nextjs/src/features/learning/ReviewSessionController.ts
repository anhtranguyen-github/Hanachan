import { submitReview } from './service';
import { Rating } from './domain/SRSAlgorithm';
import { srsRepository } from './srsRepository';
import { questionRepository } from './questionRepository';

export interface QuizItem {
    id: string; // unitId-facet
    ku_id: string;
    character: string;
    type: string;
    prompt: string;
    prompt_variant: string; // meaning, reading, cloze
    meaning: string;
    reading?: string;
    cloze_answer?: string;
    sentence_ja?: string;
    sentence_en?: string;
    currentState: any;
}

export class ReviewSessionController {
    private queue: QuizItem[] = [];
    private completedCount: number = 0;
    private userId: string;
    private sessionId: string | null = null;
    private totalItems: number = 0;

    // State tracking for the current session (FIF Architecture)
    private sessionState: Map<string, { attemptCount: number, wrongCount: number }> = new Map();

    constructor(userId: string) {
        this.userId = userId;
    }

    async initSession(items: any[]) {
        // Fetch questions for all items in the session
        const kuFacetPairs = items.map(item => ({
            unitId: item.ku_id,
            facet: item.facet
        }));

        const questions = await questionRepository.fetchQuestionsBatch(kuFacetPairs);

        this.queue = this.transformItems(items, questions);
        this.totalItems = this.queue.length;

        // Persist Session Header
        try {
            const session = await srsRepository.createReviewSession(this.userId, this.totalItems);
            this.sessionId = session.id;

            // Optional: Persist initial items if we want a full trace
            const sessionItems = this.queue.map(item => ({
                ku_id: item.ku_id,
                facet: item.prompt_variant
            }));
            await srsRepository.createReviewSessionItems(this.sessionId, sessionItems);
        } catch (error) {
            console.error("[ReviewSessionController] Failed to persist session header:", error);
        }

        return this.queue;
    }

    private transformItems(items: any[], questions: any[]): QuizItem[] {
        return items.map(item => {
            const ku = item.knowledge_units;
            if (!ku) {
                console.warn(`[ReviewSessionController] Item ${item.id} has no knowledge_units metadata.`);
                return null;
            }

            const question = questions.find(q => q.ku_id === item.ku_id && q.facet === item.facet);

            // Fallback reading mapping
            const reading = ku.vocabulary_details?.[0]?.reading ||
                ku.kanji_details?.[0]?.onyomi?.[0] ||
                ku.kanji_details?.[0]?.kunyomi?.[0];

            return {
                id: `${item.ku_id}-${item.facet}`,
                ku_id: item.ku_id,
                character: ku.character || ku.slug?.split(':')[1] || '?',
                type: ku.type,
                // Fallback prompt: use character or meaning if question is missing
                prompt: question?.prompt || (item.facet === 'meaning' ? ku.character : (ku.character || ku.meaning)),
                prompt_variant: item.facet,
                meaning: ku.meaning,
                reading: reading,
                cloze_answer: item.facet === 'cloze' ? (question?.correct_answers?.[0] || ku.meaning) : undefined,
                sentence_ja: question?.cloze_text_with_blanks || (item.facet === 'cloze' ? "Grammar check: Try to recall the structure." : undefined),
                sentence_en: question?.hints?.[0] || (item.facet === 'cloze' ? ku.meaning : undefined),
                currentState: {
                    stage: item.state,
                    stability: item.stability,
                    difficulty: item.difficulty,
                    reps: item.reps,
                    lapses: item.lapses
                }
            } as QuizItem;
        }).filter((item): item is QuizItem => !!item && !!item.ku_id);
    }

    getNextItem(): QuizItem | null {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    /**
     * REVIEW SESSION LOGIC: Failure Intensity Framework (FIF)
     * Rule: 
     * - Incorrect -> Increment wrongCount, Requeue (No FSRS Update)
     * - Correct -> Calculate Penalty (log2) -> Update FSRS Once -> Remove
     */
    async submitAnswer(rating: Rating): Promise<boolean> {
        const current = this.queue[0];
        if (!current) return false;

        const isSuccess = rating === 'pass';

        // Initialize state if not exists
        if (!this.sessionState.has(current.id)) {
            this.sessionState.set(current.id, { attemptCount: 0, wrongCount: 0 });
        }
        const state = this.sessionState.get(current.id)!;
        state.attemptCount++;

        if (!isSuccess) {
            // === INCORRECT LOOP ===
            state.wrongCount++;

            // 1. Persist Attempt (Log it, even if we don't update FSRS yet)
            if (this.sessionId) {
                // Update status to 'pending' or 'failed' but keep it alive
                // We log the fail rating to user_learning_logs via a 'quiet' log if needed
                // For now, update session item status to track it's active
                await srsRepository.updateReviewSessionItem(
                    this.sessionId,
                    current.ku_id,
                    current.prompt_variant,
                    'incorrect',
                    'again',
                    state.wrongCount,
                    state.attemptCount
                );
            }

            // 2. Re-queue at the end
            this.queue.shift();
            this.queue.push(current);
            console.log(`[FIF] Item ${current.id} incorrect. WrongCount=${state.wrongCount}. Requeued.`);

            return false;
        }

        // === CORRECT LOOP (COMMIT) ===
        else {
            // 1. Calculate FSRS with FIF
            // state.wrongCount holds the total failures in this session
            await submitReview(
                this.userId,
                current.ku_id,
                current.prompt_variant,
                rating,
                current.currentState,
                // Pass wrongCount to the Service to forward to FSRSEngine
                state.wrongCount
            );

            // 2. Queue Management
            this.queue.shift(); // Remove
            this.completedCount++;
            this.sessionState.delete(current.id); // Cleanup memory

            // 3. Persist Success
            if (this.sessionId) {
                await srsRepository.updateReviewSessionItem(
                    this.sessionId,
                    current.ku_id,
                    current.prompt_variant,
                    'correct',
                    rating,
                    state.wrongCount,
                    state.attemptCount
                );
                srsRepository.incrementSessionProgress(this.sessionId);
            }

            console.log(`[FIF] Item ${current.id} graduate. Wrongs=${state.wrongCount}.`);

            // If queue empty, finish session
            if (this.queue.length === 0 && this.sessionId) {
                srsRepository.finishReviewSession(this.sessionId);
            }

            return true;
        }
    }

    getProgress() {
        return {
            completed: this.completedCount,
            total: this.totalItems,
            percentage: (this.completedCount / Math.max(this.totalItems, 1)) * 100
        };
    }

    getSessionId() {
        return this.sessionId;
    }
}
