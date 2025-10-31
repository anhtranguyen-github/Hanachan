'use client';

import React, { Suspense } from 'react';
import ChatClientView from '@/features/chat/components/ChatClientView';

export default function ChatPage({ searchParams }: { searchParams: { id?: string } }) {
    const conversationId = searchParams?.id;
    const conversations: any[] = [];
    const currentConversation = null;

    return (
        <Suspense fallback={null}>
            <ChatClientView
                initialConversations={conversations}
                initialConversation={currentConversation}
                conversationId={conversationId}
            />
        </Suspense>
    );
}
