
'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendMessageAction, getSessionHistoryAction, createSessionAction } from '../actions';
import { ChatMessage, ChatSession } from '../types';

export function useChatSession(conversationId?: string, userId: string = "00000000-0000-0000-0000-000000000000") {
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
            const result = await sendMessageAction(conversationId, userId, content);
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
        await createSessionAction(id, userId);
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
