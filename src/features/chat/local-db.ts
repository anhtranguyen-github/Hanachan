
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CHAT_FILE = path.join(DATA_DIR, 'chat_sessions.json');
const SRS_FILE = path.join(DATA_DIR, 'srs_mock.json');

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    userId: string;
    messages: ChatMessage[];
    context?: any;
    updatedAt: string;
}

export class LocalChatRepo {
    private load(file: string): any {
        if (!fs.existsSync(file)) return {};
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'));
        } catch { return {}; }
    }

    private save(file: string, data: any) {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    }

    // Chat Session Logic
    getSession(sessionId: string): ChatSession | null {
        const data = this.load(CHAT_FILE);
        return data[sessionId] || null;
    }

    createSession(sessionId: string, userId: string): ChatSession {
        const data = this.load(CHAT_FILE);
        const session: ChatSession = {
            id: sessionId,
            userId,
            messages: [],
            updatedAt: new Date().toISOString()
        };
        data[sessionId] = session;
        this.save(CHAT_FILE, data);
        return session;
    }

    addMessage(sessionId: string, message: ChatMessage) {
        const data = this.load(CHAT_FILE);
        if (!data[sessionId]) throw new Error("Session not found");
        data[sessionId].messages.push(message);
        data[sessionId].updatedAt = new Date().toISOString();
        this.save(CHAT_FILE, data);
    }

    // SRS Mock Logic
    getSRSStates(userId: string): any[] {
        const data = this.load(SRS_FILE);
        return data[userId] || [];
    }

    seedSRSData(userId: string, items: any[]) {
        const data = this.load(SRS_FILE);
        data[userId] = items;
        this.save(SRS_FILE, data);
    }
}

export const localChatRepo = new LocalChatRepo();
