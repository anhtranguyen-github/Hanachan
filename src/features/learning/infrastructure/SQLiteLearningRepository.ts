import Database from "better-sqlite3";
import { ILearningRepository, SRSState } from "../domain/interfaces/ILearningRepository";
import { join } from "path";

export class SQLiteLearningRepository implements ILearningRepository {
    private db: Database.Database;

    constructor(dbPath: string = join(process.cwd(), "src/db/local.db")) {
        this.db = new Database(dbPath);
    }

    async getState(kuId: string): Promise<SRSState | null> {
        const row = this.db.prepare("SELECT * FROM learning_state WHERE ku_id = ?").get(kuId) as any;
        if (!row) return null;
        return this.mapToState(row);
    }

    async saveState(state: SRSState): Promise<void> {
        const sql = `
            INSERT OR REPLACE INTO learning_state 
            (ku_id, ku_type, srs_level, next_review, ease_factor, interval, repetitions, lapses, last_practiced)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        this.db.prepare(sql).run(
            state.kuId,
            state.kuType,
            state.srsLevel,
            state.nextReview?.toISOString() || null,
            state.easeFactor,
            state.interval,
            state.repetitions,
            state.lapses,
            state.lastPracticed.toISOString()
        );
    }

    async getDueItems(limit: number = 50): Promise<SRSState[]> {
        const now = new Date().toISOString();
        const rows = this.db.prepare(`
            SELECT * FROM learning_state 
            WHERE next_review IS NULL OR next_review <= ? 
            ORDER BY next_review ASC 
            LIMIT ?
        `).all(now, limit) as any[];

        return rows.map(row => this.mapToState(row));
    }

    private mapToState(row: any): SRSState {
        return {
            kuId: row.ku_id,
            kuType: row.ku_type,
            srsLevel: row.srs_level,
            nextReview: row.next_review ? new Date(row.next_review) : null,
            easeFactor: row.ease_factor,
            interval: row.interval,
            repetitions: row.repetitions,
            lapses: row.lapses,
            lastPracticed: new Date(row.last_practiced)
        };
    }
}
