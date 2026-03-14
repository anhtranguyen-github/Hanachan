// Server-side chat service - do NOT add 'use client' here
// This module MUST NOT call OpenAI/LangChain directly.
// Architecture: UI → Next.js (BFF) → FastAPI agents → provider.
import { getBearerFromSupabaseCookie } from '@/lib/auth-utils';
import { chatRepo } from './chat-repo';
import { kuRepository } from '@/features/knowledge/db';
import { agentsClient } from '@/services/agentsClient';

export class HanachanChatService {


    constructor() {}

    private async getAuthHeader(): Promise<string | null> {
        return getBearerFromSupabaseCookie();
    }

    async sendMessage(sessionId: string, userId: string, text: string) {
        let session = await chatRepo.getSession(sessionId);
        if (!session) session = await chatRepo.createSession(sessionId, userId);
        const resolvedSessionId = session.id;

        const data = await agentsClient.sendMessage({
            user_id: userId,
            message: text,
            session_id: resolvedSessionId,
        });

        const cleanReply = data.response ?? '';

        await chatRepo.addMessage(resolvedSessionId, {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        });

        const referencedKUs = await this.detectKUs(cleanReply);

        await chatRepo.addMessage(resolvedSessionId, {
            role: 'assistant',
            content: cleanReply,
            timestamp: new Date().toISOString(),
            metadata: { referencedKUs }
        });

        return { reply: cleanReply, actions: [], referencedKUs };
    }

    private async detectKUs(text: string) {
        const refs: any[] = [];
        const matches = text.match(/[A-Za-z0-9-]+|[\u4e00-\u9faf]/g) || [];
        const uniqueMatches = Array.from(new Set(matches));

        for (const m of uniqueMatches) {
            if (m.length < 1 || refs.length >= 3) break;
            const { data } = await kuRepository.search(m, undefined, 1, 1);
            if (data && data.length > 0) {
                const k = data[0];
                refs.push({ id: k.id, slug: k.slug, character: k.character, type: k.type });
            }
        }
        return refs;
    }
}

let _instance: HanachanChatService | null = null;

export const advancedChatService = new Proxy({} as HanachanChatService, {
    get(_target, prop) {
        if (!_instance) _instance = new HanachanChatService();
        return (_instance as any)[prop];
    },
});
