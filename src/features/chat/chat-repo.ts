import { createClient } from '@/services/supabase/server';
import { ChatMessage, ChatSession } from './types';

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";

export class ChatRepository {

    async getSession(sessionId: string): Promise<ChatSession | null> {
        const supabase = createClient();

        // 1. Get Session Info
        const { data: session } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (!session) return null;

        // 2. Get Messages
        const { data: messages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        return {
            id: session.id,
            userId: session.user_id,
            updatedAt: session.updated_at,
            messages: (messages || []).map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.created_at
            }))
        };
    }

    async createSession(sessionId: string, userId: string = DUMMY_USER_ID): Promise<ChatSession> {
        const supabase = createClient();

        // Upsert Session to ensure existence
        const { error } = await supabase
            .from('chat_sessions')
            .upsert({
                id: sessionId,
                user_id: userId,
                title: "New Chat",
                updated_at: new Date().toISOString()
            });

        if (error) console.error("❌ Error creating session:", error);

        return {
            id: sessionId,
            userId,
            messages: [],
            updatedAt: new Date().toISOString()
        };
    }

    async addMessage(sessionId: string, message: ChatMessage) {
        const supabase = createClient();

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                session_id: sessionId,
                role: message.role,
                content: message.content,
                created_at: message.timestamp
            });

        if (error) console.error("❌ Error saving message:", error);
    }

    // SRS Retrieval from DB
    async getSRSStates(userId: string = DUMMY_USER_ID): Promise<any[]> {
        const supabase = createClient();
        const { data } = await supabase
            .from('user_learning_states')
            .select('*')
            .eq('user_id', userId);
        return data || [];
    }
}

export const chatRepo = new ChatRepository();
// Alias for backward compatibility during refactor
export const localChatRepo = chatRepo; 
