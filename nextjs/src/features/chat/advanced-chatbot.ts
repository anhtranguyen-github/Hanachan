'use client';
// This is actually a server-side service but it was marked as client? 
// No, the file is in src/features/chat/advanced-chatbot.ts. It should NOT be 'use client'.

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { chatRepo } from './chat-repo';
import { PersonaInjector, ProjectAwarenessInjector } from './injectors';
import { classifyIntent } from './chat-router';
import { getMemoryContext } from '@/lib/memory-client';
import { kuRepository } from '@/features/knowledge/db';

export class HanachanChatService {
    private llm: ChatOpenAI;
    private personaInjector = new PersonaInjector();
    private projectInjector = new ProjectAwarenessInjector();

    constructor() {
        this.llm = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.3,
        });
    }

    async sendMessage(sessionId: string, userId: string, text: string) {
        let session = await chatRepo.getSession(sessionId);
        if (!session) session = await chatRepo.createSession(sessionId, userId);
        const resolvedSessionId = session.id;

        const intent = classifyIntent(text);
        const summary = session.summary || "No summary yet.";

        let memoryContext = '';
        try {
            const ctx = await getMemoryContext(userId, text, resolvedSessionId, 5);
            memoryContext = ctx.system_prompt_block;
        } catch (err: any) {
            console.error("Memory retrieval failed:", err.message);
        }

        const systemContext = await this.buildSystemContext(userId, intent, summary, memoryContext, text);

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", "{system_context}"],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ]);

        const chain = promptTemplate.pipe(this.llm);

        const historyLimit = 12;
        const history = session.messages.slice(-historyLimit).map((m: any) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        const response = await chain.invoke({
            system_context: systemContext,
            history: history,
            input: text
        });

        const replyText = response.content as string;
        let cleanReply = replyText;

        // Metadata extraction
        const sMatch = replyText.match(/\[\[SUMMARY_UPDATE\]\]([\s\S]*?)(\[\[|$)/);
        const tMatch = replyText.match(/\[\[TITLE_UPDATE\]\]([\s\S]*?)(\[\[|$)/);

        if (sMatch || tMatch) {
            const updates: any = {};
            if (sMatch) updates.summary = sMatch[1].trim();
            if (tMatch) updates.title = tMatch[1].trim();
            await chatRepo.updateSession(resolvedSessionId, updates);
            cleanReply = replyText
                .replace(/\[\[SUMMARY_UPDATE\]\][\s\S]*?(\[\[TITLE_UPDATE\]\]|$)/, '')
                .replace(/\[\[TITLE_UPDATE\]\][\s\S]*?$/, '')
                .trim();
        }

        const implicitSummaryMatch = replyText.match(/<session_summary>([\s\S]*?)<\/session_summary>/);
        if (implicitSummaryMatch) {
            await chatRepo.updateSessionSummary(resolvedSessionId, implicitSummaryMatch[1].trim());
            cleanReply = cleanReply.replace(/<session_summary>[\s\S]*?<\/session_summary>/, "").trim();
        }

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

    private async buildSystemContext(userId: string, intent: string, summary: string, memoryContext: string, text: string): Promise<string> {
        let context = `You are Hanachan, an expert Japanese language tutor.\n\n### SESSION SUMMARY:\n${summary}\n`;

        if (memoryContext) {
            context += `\n### LONG-TERM MEMORY:\n${memoryContext}\n`;
        }

        context += await this.personaInjector.inject(userId);

        if (text.toLowerCase().includes("project") || text.toLowerCase().includes("stack")) {
            context += await this.projectInjector.inject(userId);
        }

        context += `\n[INSTRUCTIONS]\n1. Be concise.\n2. Use [[SUMMARY_UPDATE]] to update state if needed.\n`;
        return context;
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

export const advancedChatService = new HanachanChatService();
