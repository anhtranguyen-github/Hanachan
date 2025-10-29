export interface SRSState {
    kuId: string;
    kuType: string;
    srsLevel: number;
    nextReview: Date | null;
    easeFactor: number;
    interval: number;
    repetitions: number;
    lapses: number;
    lastPracticed: Date;
}

export interface ILearningRepository {
    getState(kuId: string): Promise<SRSState | null>;
    saveState(state: SRSState): Promise<void>;
    getDueItems(limit?: number): Promise<SRSState[]>;
}
