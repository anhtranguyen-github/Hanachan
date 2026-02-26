```typescript
import { Rating } from './domain/SRSAlgorithm';
import { lessonRepository } from './lessonRepository';
import { questionRepository } from './questionRepository';

export interface LearningItem {
    id: string;
    ku_id: string;
    character: string;
    type: string;
    meaning: string;
    reading?: string;
    status: 'unseen' | 'viewed' | 'quiz_passed';
    mnemonic?: string;
    examples?: any[];
}

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
}

/**
 * LearningController - Discovery Flow Orchestrator
 * Logic: Batch Persistence & Deferred SRS Initialization
 */
export class LearningController {
    private userId: string;
    private batchId: string;
    private items: any[] = []; // Raw items from DB
    private quizQueue: QuizItem[] = [];

    // UI State
    private currentIndex: number = 0;
    private completedCount: number = 0;
    private totalQuizItems: number = 0;
    private questions: any[] = [];
    private initialFacets: Map<string, string[]> = new Map();

    constructor(userId: string, batchId: string) {
        this.userId = userId;
        this.batchId = batchId;
    }

    async init(items: any[]) {
        this.items = items;
        const unitIds = items.map(p => p.ku_id || p.id);

        // Fetch all questions for these KUs from DB
        this.questions = await questionRepository.fetchAllQuestionsForUnits(unitIds);

        // Prepare initial facets mapping for SRS initialization later
        items.forEach(item => {
            const unitId = item.ku_id || item.id;
            const itemQuestions = this.questions.filter(q => q.ku_id === unitId);
            this.initialFacets.set(unitId, itemQuestions.map(q => q.facet));
        });

        return this.items;
    }

    // --- Lesson Phase ---

    getCurrentLessonIndex() {
        return this.currentIndex;
    }

    async nextLessonItem(): Promise<boolean> {
        const current = this.items[this.currentIndex];
        const unitId = current.ku_id || current.id;

        if (unitId) {
            // Persist viewing progress
            await lessonRepository.updateLessonItemStatus(this.batchId, unitId, 'viewed');
        }

        if (this.currentIndex < this.items.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    // --- Quiz Phase ---

    startQuiz() {
        this.quizQueue = this.transformToQuizItems();
        this.totalQuizItems = this.quizQueue.length;
        this.completedCount = 0;
        return this.quizQueue;
    }

    private transformToQuizItems(): QuizItem[] {
        // Map stored DB questions directly to QuizItems
        const result: QuizItem[] = this.questions.map(q => {
            const ku = this.items.find(i => (i.ku_id || i.id) === q.ku_id);
            return {
                id: `${ q.ku_id } -${ q.facet } `,
                ku_id: q.ku_id,
                character: ku?.character || ku?.knowledge_units?.character || ku?.slug || ku?.knowledge_units?.slug,
                type: ku?.type || ku?.knowledge_units?.type,
                prompt: q.prompt,
                prompt_variant: q.facet,
                meaning: ku?.meaning || ku?.knowledge_units?.meaning,
                reading: ku?.vocabulary_details?.[0]?.reading || ku?.knowledge_units?.vocabulary_details?.[0]?.reading ||
                    ku?.kanji_details?.[0]?.onyomi?.[0] || ku?.knowledge_units?.kanji_details?.[0]?.onyomi?.[0],
                cloze_answer: q.facet === 'cloze' ? q.correct_answers?.[0] : undefined,
                sentence_ja: q.cloze_text_with_blanks,
                sentence_en: q.hints?.[0]
            };
        });

        // Sort: Meaning before Reading
        result.sort((a, b) => {
            if (a.prompt_variant === 'meaning' && b.prompt_variant === 'reading') return -1;
            if (a.prompt_variant === 'reading' && b.prompt_variant === 'meaning') return 1;
            return 0;
        });

        return result;
    }

    getCurrentQuizItem(): QuizItem | null {
        return this.quizQueue.length > 0 ? this.quizQueue[0] : null;
    }

    /**
     * DISCOVERY LOGIC: Deferred Updates
     * Rule 1: No SRS update during quiz attempts.
     * Rule 2: Initialize SRS ONLY when KU is fully passed (All facets answered correctly).
     */
    async submitQuizAnswer(rating: Rating): Promise<boolean> {
        const current = this.quizQueue[0];
        if (!current) return false;

        const isSuccess = rating === 'good';

        if (isSuccess) {
            this.quizQueue.shift();
            this.completedCount++;

            // If this was the last facet for this KU in the queue, it means it's passed
            if (!this.quizQueue.some(q => q.ku_id === current.ku_id)) {
                console.log(`[LearningController] KU ${ current.ku_id } passed quiz.Initializing SRS.`);

                // 1. Update Lesson Item Status to quiz_passed
                await lessonRepository.updateLessonItemStatus(this.batchId, current.ku_id, 'quiz_passed');

                // 2. Initialize SRS for all facets
                const facets = this.initialFacets.get(current.ku_id) || [];
                const { initializeSRSAction } = await import('./actions');
                await initializeSRSAction(this.userId, current.ku_id, facets);
            }
        } else {
            // Mistake: Re-queue at end, NO SRS update (No stability penalty in Learn phase)
            const failed = this.quizQueue.shift()!;
            this.quizQueue.push(failed);
        }

        return isSuccess;
    }

    isBatchComplete(): boolean {
        return this.quizQueue.length === 0;
    }

    getProgress() {
        return {
            completed: this.completedCount,
            total: this.totalQuizItems,
            percentage: (this.completedCount / Math.max(this.totalQuizItems, 1)) * 100
        };
    }
}
