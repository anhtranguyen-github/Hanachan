'use client';

import { useState } from 'react';

export function useChatSession(options: any = {}) {
    const [messages, setMessages] = useState<any[]>(options.initialMessages || [
        { id: '1', role: 'assistant', content: 'こんにちは！今日は何を勉強しますか？' }
    ]);

    const sendMessage = async (content: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }]);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'That sounds interesting! Let me help you with that.' }]);
        }, 1000);
    };

    return {
        state: 'idle',
        conversations: [],
        messages,
        pendingDeck: null,
        loadConversations: async () => { },
        createNewConversation: () => { },
        sendMessage,
        confirmDeck: async () => { },
        cancelDeck: () => { },
        deleteConversation: async (id: string) => { },
        canSend: true,
        isLoading: false
    };
}
