
'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendMessageAction, getSessionHistoryAction, createSessionAction, getUserSessionsAction } from '../actions';
import { ChatMessage, ChatSession } from '../types';

export function useChatSession(conversationId?: string) {
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
        const data = await getUserSessionsAction();
        setSessions(data || []);
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    useEffect(() => {
        if (conversationId) {
            loadHistory(conversationId);
        }
    }, [conversationId, loadHistory]);

    const sendMessage = async (content: string) => {
        if (!conversationId) return;

        // Optimistic UI
        const userMsg: ChatMessage = {
            role: 'user',
            content,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const result = await sendMessageAction(conversationId, content);
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
        const id = `session-${Date.now()}`;
        try {
            await createSessionAction(id);
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
