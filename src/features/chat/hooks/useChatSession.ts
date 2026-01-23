
'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendMessageAction, getSessionHistoryAction, createSessionAction, getUserSessionsAction } from '../actions';
import { ChatMessage, ChatSession } from '../types';

export function useChatSession(userId?: string, conversationId?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);

    // Load History
    const loadHistory = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const session = await getSessionHistoryAction(id);
            if (session) {
                setMessages(session.messages);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadSessions = useCallback(async () => {
        if (!userId) return;
        const data = await getUserSessionsAction(userId);
        setSessions(data || []);
    }, [userId]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    useEffect(() => {
        if (conversationId) {
            loadHistory(conversationId);
        }
    }, [conversationId, loadHistory]);

    const sendMessage = async (content: string) => {
        if (!userId || !conversationId) return;

        // Optimistic UI
        const userMsg: ChatMessage = {
            role: 'user',
            content,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const result = await sendMessageAction(conversationId, userId, content) as any;
            if (result.success && result.reply) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: result.reply!,
                    timestamp: new Date().toISOString()
                }]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewConversation = async () => {
        if (!userId) return null;
        const id = crypto.randomUUID();
        try {
            await createSessionAction(id, userId);
        } catch (error) {
            console.error('❌ createSessionAction failed:', error);
        }
        return id;
    };

    return {
        messages,
        isLoading,
        sessions,
        sendMessage,
        createNewConversation,
        loadHistory
    };
}
