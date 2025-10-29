import { SRSState } from "./interfaces/ILearningRepository";

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2 Algorithm Implementation
 */
export class SRSAlgorithm {
    static processReview(state: SRSState, grade: SRSGrade): SRSState {
        let { srsLevel, easeFactor, interval, repetitions, lapses } = state;

        if (grade >= 3) {
            // Correct
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions++;
            srsLevel++;
        } else {
            // Incorrect
            repetitions = 0;
            interval = 1;
            lapses++;
            if (srsLevel > 0) srsLevel--;
        }

        // Update Ease Factor
        easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        return {
            ...state,
            srsLevel,
            easeFactor,
            interval,
            repetitions,
            lapses,
            nextReview,
            lastPracticed: new Date()
        };
    }

    static createInitialState(kuId: string, kuType: string): SRSState {
        return {
            kuId,
            kuType,
            srsLevel: 0,
            nextReview: null,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            lapses: 0,
            lastPracticed: new Date()
        };
    }
}
