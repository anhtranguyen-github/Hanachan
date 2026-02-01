import { z } from 'zod';
import { ChatMessageSchema, ChatSessionSchema } from '@/lib/validation';

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;

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
