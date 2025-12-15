
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    userId: string;
    messages: ChatMessage[];
    updatedAt: string;
}
