'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useChatSession } from '../hooks/useChatSession';
import { useUser } from '@/features/auth/AuthContext';

type ChatContextType = ReturnType<typeof useChatSession>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const chat = useChatSession(user?.id);

    return (
        <ChatContext.Provider value={chat}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
