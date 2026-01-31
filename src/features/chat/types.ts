import { z } from 'zod';
import { ChatMessageSchema, ChatSessionSchema } from '@/lib/validation';

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export interface ReferencedKU {
    id: string;
    slug: string;
    character: string;
    type: string;
}

export interface ToolMetadata {
    toolName: string;
    resultSummary: string;
}

export interface AgentResponse {
    reply: string;
    toolsUsed: ToolMetadata[];
    referencedKUs: ReferencedKU[];
}
