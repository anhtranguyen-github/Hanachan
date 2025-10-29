export interface Conversation {
    id: string;
    title?: string;
    created_at: string;
    messages?: Message[];
    [key: string]: any;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    [key: string]: any;
}
