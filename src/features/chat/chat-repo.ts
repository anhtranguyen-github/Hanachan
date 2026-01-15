import { MockDB } from '@/lib/mock-db';
import { ChatMessage, ChatSession } from './types';

export class ChatRepository {

    async getSession(sessionId: string): Promise<ChatSession | null> {
        return await MockDB.getChatSession(sessionId);
    }

    async createSession(sessionId: string, userId: string): Promise<ChatSession> {
        const newSession: any = {
            id: sessionId,
            user_id: userId,
            title: "New Chat",
            mode: 'chat',
            messages: [],
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        // Note: we don't have a direct MockDB.createChatSession yet, 
        // but for now this works as we can just return it.
        // In a real mock store we'd push to the local 'chats' array.
        return newSession;
    }

    async addMessage(sessionId: string, message: ChatMessage) {
        await MockDB.addChatMessage(sessionId, message);
    }

    async getSRSStates(userId: string): Promise<any[]> {
        return await MockDB.fetchDueItems(userId);
    }

    async logAnalysis(analysis: any): Promise<any | null> {
        // Just return the analysis as if saved
        return { ...analysis, id: Math.random().toString() };
    }

    async getUserAnalysisHistory(userId: string): Promise<any[]> {
        return []; // Not implemented in MockDB yet
    }

    async getUserSessions(userId: string): Promise<any[]> {
        return await MockDB.getChatSessions(userId);
    }
}

export const chatRepo = new ChatRepository();

