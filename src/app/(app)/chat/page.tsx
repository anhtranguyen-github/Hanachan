
'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChatInterface } from '@/features/chat/components/ChatInterface';
import { useChatSession } from '@/features/chat/hooks/useChatSession';

export default function ChatPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const conversationId = searchParams.get('id');

    const {
        messages,
        isLoading,
        sessions,
        sendMessage,
        createNewConversation
    } = useChatSession(conversationId || undefined);

    const handleNewSession = async () => {
        const newId = await createNewConversation();
        router.push(`/chat?id=${newId}`);
    };


    return (
        <div data-testid="chat-ready" className="h-full">
            <ChatInterface
                messages={messages}
                isLoading={isLoading}
                sessions={sessions}
                activeSessionId={conversationId || undefined}
                onSendMessage={sendMessage}
                onNewSession={handleNewSession}
                onSelectSession={(id) => router.push(`/chat?id=${id}`)}
                onDeleteSession={(id) => console.log('Delete', id)}
            />
        </div>
    );
}
