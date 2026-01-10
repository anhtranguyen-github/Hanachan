
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CKB_FILE = path.join(DATA_DIR, 'ckb.json');
const USER_KUS_FILE = path.join(DATA_DIR, 'user_kus.json');

// --- Types ---
export type KUType = 'vocabulary' | 'kanji' | 'grammar' | 'radical';
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type LearningStatus = 'locked' | 'learning' | 'mastered';

export interface KnowledgeUnit {
    slug: string; // unique ID (e.g., "猫")
    type: KUType;
    level: number; // 1-60
    jlpt: JLPTLevel;
    meanings: string[];
    readings: string[];
    // Mocking relations
    sentences: string[]; // IDs of example sentences
}

export interface UserKUState {
    slug: string;
    status: LearningStatus;
    isBookmarked: boolean;
    lastStudy: string;
}

export interface SearchFilters {
    type?: KUType;
    level?: number;             // Exact level
    levelRange?: [number, number]; // e.g. [1, 10]
    jlpt?: JLPTLevel;
    status?: LearningStatus;
    search?: string;
}

// --- Service ---
export class KnowledgeBaseService {

    private loadCKB(): KnowledgeUnit[] {
        if (!fs.existsSync(CKB_FILE)) return [];
        try { return JSON.parse(fs.readFileSync(CKB_FILE, 'utf-8')); } catch { return []; }
    }

    private loadUserStates(): Record<string, UserKUState> {
        if (!fs.existsSync(USER_KUS_FILE)) return {};
        try { return JSON.parse(fs.readFileSync(USER_KUS_FILE, 'utf-8')); } catch { return {}; }
    }

    private saveUserStates(data: Record<string, UserKUState>) {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(USER_KUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Seed Mock Data (For Development)
     */
    seedMockData() {
        const mockData: KnowledgeUnit[] = [
            { slug: "猫", type: "vocabulary", level: 2, jlpt: "N5", meanings: ["Cat"], readings: ["ねこ"], sentences: ["s1"] },
            { slug: "犬", type: "vocabulary", level: 2, jlpt: "N5", meanings: ["Dog"], readings: ["いぬ"], sentences: ["s2"] },
            { slug: "食べる", type: "vocabulary", level: 3, jlpt: "N5", meanings: ["To eat"], readings: ["たべる"], sentences: ["s1"] },
            { slug: "日", type: "kanji", level: 1, jlpt: "N5", meanings: ["Sun", "Day"], readings: ["ニチ", "ジツ", "ひ", "か"], sentences: [] },
            { slug: "一", type: "radical", level: 1, jlpt: "N5", meanings: ["Ground"], readings: [], sentences: [] }
        ];
        fs.writeFileSync(CKB_FILE, JSON.stringify(mockData, null, 2), 'utf-8');
        console.log("🌱 CKB Mock Data Seeded.");
    }

    /**
     * Search and Filter KUs.
     */
    search(filters: SearchFilters): (KnowledgeUnit & { userState?: UserKUState })[] {
        let kus = this.loadCKB();
        const userStates = this.loadUserStates();

        // 1. Text Search
        if (filters.search) {
            const term = filters.search.toLowerCase();
            kus = kus.filter(k => k.slug.includes(term) || k.meanings.some(m => m.toLowerCase().includes(term)));
        }

        // 2. Type Filter
        if (filters.type) {
            kus = kus.filter(k => k.type === filters.type);
        }

        // 3. Level Filter
        if (filters.level) {
            kus = kus.filter(k => k.level === filters.level);
        }

        // 4. Join User State & Filter Status
        let results = kus.map(k => ({ ...k, userState: userStates[k.slug] || { slug: k.slug, status: 'locked', isBookmarked: false, lastStudy: '' } }));

        if (filters.status) {
            results = results.filter(k => k.userState.status === filters.status);
        }

        return results;
    }

    /**
     * Toggle Bookmark
     */
    toggleBookmark(slug: string) {
        const states = this.loadUserStates();
        if (!states[slug]) {
            states[slug] = { slug, status: 'locked', isBookmarked: true, lastStudy: '' };
        } else {
            states[slug].isBookmarked = !states[slug].isBookmarked;
        }
        this.saveUserStates(states);
        console.log(`🔖 Toggled bookmark for ${slug}: ${states[slug].isBookmarked}`);
    }
}

export const kbService = new KnowledgeBaseService();
