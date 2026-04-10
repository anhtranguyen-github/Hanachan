import { submitReviewAction } from './actions';
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
    sentence_ja?: string;
    sentence_en?: string;
}

export class ReviewSessionController {
    private queue: QuizItem[] = [];
    private completedCount: number = 0;
    private userId: string;
    private totalItems: number = 0;

    // Failure Intensity Framework (FIF) state
    private sessionState: Map<string, { incorrectMeaning: number, incorrectReading: number, attempts: number }> = new Map();

    constructor(userId: string) {
        this.userId = userId;
    }

    async initSession(assignments: AssignmentResource[]) {
        // Fetch subjects for these assignments
        const subjectIds = Array.from(new Set(assignments.map(a => a.data.subject_id)));
        const subjectsRes = await wanikaniClient.listSubjects({ ids: subjectIds });
        const subjectsMap = new Map(subjectsRes.data.map(s => [s.id, s]));

        // Enrich assignments with subjects
        assignments.forEach(ass => {
            ass.data.subject = subjectsMap.get(ass.data.subject_id);
        });

        this.queue = this.transformAssignments(assignments);
        this.totalItems = assignments.length;
        
        return this.queue;
    }

    private transformAssignments(assignments: AssignmentResource[]): QuizItem[] {
        const items: QuizItem[] = [];

        for (const ass of assignments) {
            const subject = ass.data.subject as SubjectResource;
            if (!subject) continue;

            const baseItem = {
                assignment_id: ass.id,
                subject_id: subject.id,
                character: subject.data.characters || '?',
                type: subject.object,
                meaning: subject.data.meanings?.[0]?.meaning || 'Unknown',
                meanings: subject.data.meanings?.map(m => m.meaning) || [],
                mnemonic: subject.data.meaning_mnemonic,
            };

            // Meaning prompt for all types
            items.push({
                ...baseItem,
                id: `${ass.id}-meaning`,
                prompt: baseItem.character,
                prompt_variant: 'meaning',
            });

            // Reading prompt for kanji and vocabulary
            if (subject.object === 'kanji' || subject.object === 'vocabulary') {
                const reading = subject.data.readings?.[0]?.reading || '';
                const readings = subject.data.readings?.map(r => r.reading) || [];
                items.push({
                    ...baseItem,
                    id: `${ass.id}-reading`,
                    prompt: baseItem.character,
                    prompt_variant: 'reading',
                    reading,
                    readings,
                });
            }
        }

        // Shuffle queue
        return items.sort(() => Math.random() - 0.5);
    }

    getNextItem(): QuizItem | null {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    async submitAnswer(isCorrect: boolean, userInput: string): Promise<boolean> {
        const current = this.queue[0];
        if (!current) return false;

        if (!this.sessionState.has(current.id)) {
            this.sessionState.set(current.id, { incorrectMeaning: 0, incorrectReading: 1, attempts: 0 });
        }
        
        const state = this.sessionState.get(current.id)!;
        state.attempts++;

        if (!isCorrect) {
            if (current.prompt_variant === 'meaning') state.incorrectMeaning++;
            else state.incorrectReading++;

            // Requeue
            this.queue.shift();
            this.queue.push(current);
            return false;
        } else {
            // Correct - removed from queue
            this.queue.shift();
            
            // If all variants for this assignment are done, submit to API
            const remainingVariants = this.queue.filter(it => it.assignment_id === current.assignment_id);
            if (remainingVariants.length === 0) {
                // Submit review for this assignment
                await submitReviewAction(
                    current.assignment_id,
                    state.incorrectMeaning,
                    state.incorrectReading
                );
                this.completedCount++;
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
}
