import { z } from 'zod';
import { ChatMessageSchema, ChatSessionSchema } from '@/lib/validation';

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
