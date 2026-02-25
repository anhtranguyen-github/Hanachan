
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SENTENCES_FILE = path.join(DATA_DIR, 'sentences.json');

export interface MinedSentence {
    id: string; // uuid
    text: string;
    translation: string;
    sourceType: 'youtube' | 'chat' | 'manual';
    sourceId?: string; // Video ID or Session ID
    timestamp?: number; // Context timestamp
    createdAt: string;
}

export class SentenceRepository {

    private load(): MinedSentence[] {
        if (!fs.existsSync(SENTENCES_FILE)) return [];
        try { return JSON.parse(fs.readFileSync(SENTENCES_FILE, 'utf-8')); }
        catch { return []; }
    }

    private save(data: MinedSentence[]) {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(SENTENCES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Saves a new sentence root. Returns existing one if duplicate found to avoid spam.
     */
    addSentence(data: Omit<MinedSentence, 'id' | 'createdAt'>): MinedSentence {
        const list = this.load();

        // Dedup check: Same text + Same Source ID
        const existing = list.find(s => s.text === data.text && s.sourceId === data.sourceId);
        if (existing) return existing;

        const newSentence: MinedSentence = {
            id: `sen-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString()
        };

        list.push(newSentence);
        this.save(list);
        console.log(`📝 Saved Sentence Root: "${data.text.substring(0, 15)}..."`);
        return newSentence;
    }

    getById(id: string): MinedSentence | undefined {
        return this.load().find(s => s.id === id);
    }

    /**
     * Finds all sentences containing a specific word (Personal Corpus Logic).
     */
    findByWord(word: string): MinedSentence[] {
        // Simple string include check for Prototype. 
        // In Prod, this would use a Token Map table.
        return this.load().filter(s => s.text.includes(word));
    }
}

export const sentenceRepo = new SentenceRepository();
