import Database from "better-sqlite3";
import { IKURepository, KnowledgeUnit, KUType } from "../domain/interfaces/IKURepository";
import { join } from "path";

export class SQLiteKURepository implements IKURepository {
    private db: Database.Database;

    constructor(dbPath: string = join(process.cwd(), "src/db/local.db")) {
        this.db = new Database(dbPath);
    }

    async getById(id: string, type: KUType): Promise<KnowledgeUnit | null> {
        const table = this.getTableName(type);
        const query = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
        const row = query.get(id) as any;

        if (!row) return null;
        return this.mapToKU(row, type);
    }

    async getByLevel(level: number, type: KUType): Promise<KnowledgeUnit[]> {
        const table = this.getTableName(type);
        const query = this.db.prepare(`SELECT * FROM ${table} WHERE level = ?`);
        const rows = query.all(level) as any[];

        return rows.map(row => this.mapToKU(row, type));
    }

    async search(query: string, type?: KUType): Promise<KnowledgeUnit[]> {
        if (type) {
            const table = this.getTableName(type);
            const sql = `SELECT * FROM ${table} WHERE character LIKE ? OR id LIKE ?`;
            const rows = this.db.prepare(sql).all(`%${query}%`, `%${query}%`) as any[];
            return rows.map(row => this.mapToKU(row, type));
        }

        // Generic search across all tables if type not specified (simplified)
        const types: KUType[] = ['kanji', 'vocabulary', 'grammar'];
        const results = await Promise.all(types.map(t => this.search(query, t)));
        return results.flat();
    }

    private getTableName(type: KUType): string {
        switch (type) {
            case 'radical': return 'radicals';
            case 'kanji': return 'kanji';
            case 'vocabulary': return 'vocabulary';
            case 'grammar': return 'grammar';
            default: throw new Error(`Unknown KU type: ${type}`);
        }
    }

    private mapToKU(row: any, type: KUType): KnowledgeUnit {
        // Extract primary meaning based on table structure
        let meaning = "";
        if (type === 'radical') meaning = row.meaning;
        else if (type === 'kanji' || type === 'vocabulary' || type === 'grammar') {
            const meanings = JSON.parse(row.meanings_json);
            meaning = Array.isArray(meanings.primary) ? meanings.primary[0] : meanings.primary || meanings[0];
        }

        return {
            id: row.id,
            type,
            character: row.character || row.title || row.slug,
            level: row.level,
            meaning: meaning,
            details: row
        };
    }
}
