import { z } from 'zod';
import { ChatMessageSchema, ChatSessionSchema } from '@/lib/validation';

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export interface ChatSession {
    id: string;
    userId: string;
    messages: ChatMessage[];
    title?: string | null;
    summary?: string | null;
    mode?: string | null;
    updatedAt: string;
}

export interface ReferencedUnit {
    id: string;
    slug: string;
    character: string;
    type: string;
}

export interface ToolMetadata {
    toolName: string;
    resultSummary: string;
    status?: 'hit' | 'miss';
}

export interface AgentResponse {
    reply: string;
    isCurriculumBased: boolean;
    toolsUsed: ToolMetadata[];
    referencedUnits: ReferencedUnit[];
}
