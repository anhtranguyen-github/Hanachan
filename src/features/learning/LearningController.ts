import { submitReviewAction, startAssignmentAction } from './actions';
import { AssignmentResource, SubjectResource } from '@/types/wanikani';
import { wanikaniClient } from '@/services/wanikaniClient';

export interface QuizItem {
    id: string; // assignmentId-variant
    assignment_id: number;
    subject_id: number;
    character: string;
    type: string;
    prompt: string;
    prompt_variant: string; // meaning, reading
    meaning: string;
    meanings: string[];
    reading?: string;
    readings?: string[];
    mnemonic?: string;
}

export class LearningController {
    private userId: string;
    private batchId: string | null;
    private assignments: AssignmentResource[] = [];
    private quizQueue: QuizItem[] = [];
    private currentIndex: number = 0;
    private completedCount: number = 0;
    private totalQuizItems: number = 0;

    constructor(userId: string, batchId: string | null = null) {
        this.userId = userId;
        this.batchId = batchId;
    }

    async init(assignments: AssignmentResource[]) {
        // Fetch subjects for these assignments
        const subjectIds = Array.from(new Set(assignments.map(a => a.data.subject_id)));
        const subjectsRes = await wanikaniClient.listSubjects({ ids: subjectIds });
        const subjectsMap = new Map(subjectsRes.data.map(s => [s.id, s]));

        // Enrich assignments
        assignments.forEach(ass => {
            ass.data.subject = subjectsMap.get(ass.data.subject_id);
        });

        this.assignments = assignments;
        return this.assignments;
    }

    getCurrentLessonIndex() {
        return this.currentIndex;
    }

    async nextLessonItem(): Promise<boolean> {
        if (this.currentIndex < this.assignments.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    startQuiz() {
        this.quizQueue = this.transformToQuizItems();
        this.totalQuizItems = this.quizQueue.length;
        this.completedCount = 0;
        return this.quizQueue;
    }

    private transformToQuizItems(): QuizItem[] {
        const result: QuizItem[] = [];

        for (const ass of this.assignments) {
            const subject = ass.data.subject as SubjectResource;
            if (!subject) continue;

            const baseItem = {
                assignment_id: Number(ass.id),
                subject_id: Number(subject.id),
                character: subject.data.characters || '?',
                type: subject.object,
                meaning: subject.data.meanings?.[0]?.meaning || 'Unknown',
                meanings: subject.data.meanings?.map(m => m.meaning) || [],
                mnemonic: subject.data.meaning_mnemonic || '',
            };

            // Meaning prompt
            result.push({
                ...baseItem,
                id: `${ass.id}-meaning`,
                prompt: baseItem.character,
                prompt_variant: 'meaning',
            });

            // Reading prompt for non-radical
            if (subject.object !== 'radical') {
                const reading = subject.data.readings?.[0]?.reading || '';
                const readings = subject.data.readings?.map(r => r.reading) || [];
                result.push({
                    ...baseItem,
                    id: `${ass.id}-reading`,
                    prompt: baseItem.character,
                    prompt_variant: 'reading',
                    reading,
                    readings,
                });
            }
        }

        // Shuffle by assignment (keep variants of same assignment together or separate?)
        // WaniKani usually shuffles variants.
        return result.sort(() => Math.random() - 0.5);
    }

    getCurrentQuizItem(): QuizItem | null {
        return this.quizQueue.length > 0 ? this.quizQueue[0] : null;
    }

    async submitQuizAnswer(isCorrect: boolean): Promise<boolean> {
        const current = this.quizQueue[0];
        if (!current) return false;

        if (isCorrect) {
            this.quizQueue.shift();
            this.completedCount++;

            // If ALL variants for this assignment are cleared, start it in SRS
            const remaining = this.quizQueue.filter(q => q.assignment_id === current.assignment_id);
            if (remaining.length === 0) {
                if (current.assignment_id > 0) {
                    console.log(`[LearningController] Assignment ${current.assignment_id} passed lesson quiz. Starting SRS.`);
                    await startAssignmentAction(current.assignment_id);
                }
            }
            return true;
        } else {
            // Requeue at end
            const failed = this.quizQueue.shift()!;
            this.quizQueue.push(failed);
            return false;
        }
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
