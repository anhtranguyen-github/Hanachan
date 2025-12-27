import { createAdminClient } from '@/services/supabase/server';
import { ChatMessage, ChatSession } from './types';

export class ChatRepository {

    async getSession(sessionId: string): Promise<ChatSession | null> {
        const supabase = createAdminClient();

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

    async createSession(sessionId: string, userId: string): Promise<ChatSession> {
        const supabase = createAdminClient();

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
        const supabase = createAdminClient();

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
    async getSRSStates(userId: string): Promise<any[]> {
        const supabase = createAdminClient();
        const { data } = await supabase
            .from('user_learning_states')
            .select('*')
            .eq('user_id', userId);
        return data || [];
    }

    // Analysis History (merged from db.ts)
    async logAnalysis(analysis: any): Promise<any | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('user_analysis_history')
            .insert(analysis)
            .select()
            .single();

        if (error) {
            console.error('Error logging analysis:', error);
            return null;
        }
        return data;
    }

    async getUserAnalysisHistory(userId: string): Promise<any[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('user_analysis_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching analysis history:', error);
            return [];
        }
        return data || [];
    }

    async getUserSessions(userId: string): Promise<any[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching user sessions:', error);
            return [];
        }
        return data || [];
    }
}

export const chatRepo = new ChatRepository();
