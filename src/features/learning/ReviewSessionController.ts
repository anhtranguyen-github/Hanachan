
import { Rating, SRSState } from './domain/FSRSEngine';
import { submitReview } from './service';
import { learningRepository } from './db';

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
    private sessionId: string | null = null;

    // State tracking for the current session
    private firstAttemptDone: Set<string> = new Set(); // item.id (kuId-facet)

    constructor(userId: string) {
        this.userId = userId;
    }

    async initSession(items: any[]) {
        this.queue = this.transformItems(items);
        this.totalItems = this.queue.length;

        // Persist Session Header
        try {
            const session = await learningRepository.createReviewSession(this.userId, this.totalItems);
            this.sessionId = session.id;

            // Persist Session Items
            const sessionItems = this.queue.map(item => ({
                ku_id: item.ku_id,
                facet: item.prompt_variant
            }));
            await learningRepository.createReviewSessionItems(this.sessionId!, sessionItems);
        } catch (e) {
            console.error("[ReviewSessionController] Failed to persist session header", e);
        }

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

            let activeVariants: string[] = [];

            // If item already has a facet (from fetchDueItems), only review THAT facet
            if (item.facet) {
                activeVariants = [item.facet];
            } else {
                // Discovery mode: determine all facets
                if (ku.type === 'grammar') {
                    activeVariants.push('cloze');
                } else if (ku.type === 'radical') {
                    activeVariants.push('meaning');
                } else {
                    activeVariants.push('meaning');
                    if (reading) activeVariants.push('reading');
                }
            }

            // Law: Meaning before Reading
            activeVariants.sort((a, b) => {
                if (a === 'meaning') return -1;
                if (b === 'meaning') return 1;
                return 0;
            });

            activeVariants.forEach(variant => {
                let sentence_ja = ku.grammar_details?.[0]?.sentence_ja || ku.sentence_ja;
                let cloze_answer = ku.grammar_details?.[0]?.cloze_answer || ku.answer || reading;

                // Business Rule: Choose a random example sentence for grammar if available
                if (ku.type === 'grammar' && ku.grammar_details?.[0]?.example_sentences) {
                    const examples = ku.grammar_details[0].example_sentences;
                    if (Array.isArray(examples) && examples.length > 0) {
                        const randomIdx = Math.floor(Math.random() * examples.length);
                        const ex = examples[randomIdx];
                        sentence_ja = ex.sentence_text || ex.ja || sentence_ja;

                        // Smart clozure: if ex has structure, find the grammar_point
                        if (ex.sentence_structure) {
                            const point = ex.sentence_structure.find((s: any) => s.type === 'grammar_point');
                            if (point) cloze_answer = point.content;
                        }

                        // Fallback to explicit answer fields
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

        // Law 1 & Law 2: FSRS update is per-facet and immediate on first attempt
        if (!this.firstAttemptDone.has(current.id)) {
            console.log(`[ReviewSessionController] First attempt for ${current.id}: ${rating}`);
            await submitReview(this.userId, current.ku_id, current.prompt_variant, rating, current.currentState);
            this.firstAttemptDone.add(current.id);

            // Persist Attempt in session tracking
            if (this.sessionId) {
                await learningRepository.updateReviewSessionItem(
                    this.sessionId,
                    current.ku_id,
                    current.prompt_variant,
                    isSuccess ? 'correct' : 'incorrect',
                    rating
                );
            }
        }

        if (isSuccess) {
            this.queue.shift();
            this.completedCount++;

            // If queue is empty, finish session in DB
            if (this.queue.length === 0 && this.sessionId) {
                await learningRepository.completeReviewSession(this.sessionId, this.completedCount);
            }

            return true;
        } else {
            // Correction Loop: Re-queue this facet to the end
            console.log(`[ReviewSessionController] Facet ${current.prompt_variant} failed for ${current.ku_id}. Item re-queued.`);
            const failedItem = this.queue.shift()!;

            // On re-queue, we don't necessarily update status to 'pending' again in DB yet, 
            // but we could if we wanted to track loops. Status 'incorrect' tells us it failed once.

            this.queue.push(failedItem);
            return false;
        }
    }

    getSessionId() {
        return this.sessionId;
    }

    getProgress() {
        return {
            completed: this.completedCount,
            total: this.totalItems,
            queueSize: this.queue.length,
            sessionId: this.sessionId
        };
    }
}
