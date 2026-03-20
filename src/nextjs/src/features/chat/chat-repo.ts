import { supabase } from '@/lib/supabase';
import { ChatMessage, ChatSession } from './types';

export class ChatRepository {

    async getSession(sessionId: string): Promise<ChatSession | null> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
        if (!isUuid) return null;

        const { data: session, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .maybeSingle();

        if (sessionError || !session) return null;

        const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        // Fetch actions for these messages
        const messageIds = (messages || []).map(m => m.id);
        const { data: actions } = await supabase
            .from('chat_message_actions')
            .select('*')
            .in('message_id', messageIds);

        const messagesWithActions = (messages || []).map(m => ({
            ...m,
            metadata: {
                ...m.metadata,
                actions: actions?.filter(a => a.message_id === m.id) || []
            }
        }));

        return {
            ...session,
            messages: messagesWithActions
        } as unknown as ChatSession;
    }

    async createSession(sessionId: string, userId: string): Promise<ChatSession> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

        const insertData: any = {
            user_id: userId
        };

        if (isUuid) {
            insertData.id = sessionId;
        }

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error("Error creating chat session:", error);
            throw error;
        }

        return { ...data, messages: [], title: data?.title, summary: data?.summary } as unknown as ChatSession;
    }

    async updateSessionTitle(sessionId: string, title: string) {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);

        if (error) {
            console.error("Error updating chat session title:", error);
            throw error;
        }
    }

    async updateSessionSummary(sessionId: string, summary: string) {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ summary, updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) {
            console.error("Error updating chat session summary:", error);
            throw error;
        }
    }

    async addMessage(sessionId: string, message: ChatMessage) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
        if (!isUuid) {
            console.error("Cannot add message to invalid session ID:", sessionId);
            return null;
        }

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                session_id: sessionId,
                role: message.role,
                content: message.content,
                metadata: message.metadata || {}
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding chat message:", error);
            return null;
        }

        // If message has actions in metadata, log them to the separate table too
        if (message.metadata?.actions) {
            for (const action of message.metadata.actions) {
                await this.logAction(data.id, action);
            }
        }

        return data;
    }

    async logAction(messageId: string, action: any) {
        const { error } = await supabase
            .from('chat_message_actions')
            .insert({
                message_id: messageId,
                action_type: action.type.toUpperCase(), // Map to DB enum (ANALYZE, etc)
                target_ku_id: action.data?.ku_id,
                target_sentence_id: action.data?.sentenceId
            });

        if (error) {
            console.error("Error logging chat action:", error);
        }
    }


    async updateSession(sessionId: string, updates: { title?: string, summary?: string, mode?: string }) {
        const { error } = await supabase
            .from('chat_sessions')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (error) {
            console.error("Error updating chat session:", error);
            throw error;
        }
    }

    async getUserSessions(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data;
    }
}

export const chatRepo = new ChatRepository();

