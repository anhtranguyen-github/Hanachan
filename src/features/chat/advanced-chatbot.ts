
import { OpenAI } from "openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { chatRepo } from './chat-repo';
import { ContextInjector, ProjectAwarenessInjector, PersonaInjector } from './injectors';
import { classifyIntent } from './chat-router';
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { kuRepository } from '../knowledge/db';
import { AgentResponse, ReferencedKU, ToolMetadata } from './types';


/**
 * HanachanChatService - The core Agentic AI Assistant.
 * Synchronized with docs/uncertain/class-diagram/chatbot.md
 */
export class HanachanChatService {
    private llm: ChatOpenAI;
    private personaInjector = new PersonaInjector();
    private projectInjector = new ProjectAwarenessInjector();

    constructor() {
        this.llm = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.7,
        });
    }

    /**
     * Main entry point for processing user messages.
     * @returns AgentResponse containing reply, tools used, and detected tri thức.
     */
    async process(sessionId: string, userId: string, text: string): Promise<AgentResponse> {
        const toolsUsed: ToolMetadata[] = [];

        // 1. Session Management
        let session = await chatRepo.getSession(sessionId);
        if (!session) {
            session = await chatRepo.createSession(sessionId, userId);
        }
        const resolvedSessionId = session.id;

        // 2. Intent Classification (Heuristic-based)
        const intent = classifyIntent(text);
        console.log(`🧭 Intent: ${intent}`);

        // 3. Tool Calling (Knowledge Search)
        let toolResults = "";
        if (intent === 'SEARCH_KU') {
            const keyword = text.replace(/search|find|lookup|for|là gì/gi, '').trim();
            const { data: results } = await kuRepository.search(keyword, undefined, 3);
            if (results && results.length > 0) {
                toolResults = `Knowledge Base Search Results for "${keyword}":\n` +
                    results.map(r => `- ${r.slug}: ${r.meaning}`).join('\n');
                toolsUsed.push({ toolName: 'knowledge_base_search', resultSummary: `Found ${results.length} results for ${keyword}` });
            }
        }

        // 4. Construct System Prompt & Inject Context
        let systemContext = await this.buildSystemContext(userId, intent);
        if (toolResults) {
            systemContext += `\n\nRelevant Knowledge from Database:\n${toolResults}`;
        }

        // 5. LLM Chain Execution
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", "{system_context}"],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ]);

        const chain = promptTemplate.pipe(this.llm);

        const history = session.messages.map((m: any) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        // Save User Message
        await chatRepo.addMessage(resolvedSessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });

        const response = await chain.invoke({
            system_context: systemContext,
            history: history,
            input: text
        });

        const replyText = response.content as string;

        // 6. Entity Detection (Identify Knowledge Units in Response)
        const referencedKUs = await this.detectEntity(replyText);

        // 7. Persist Assistant Message
        await chatRepo.addMessage(resolvedSessionId, {
            role: 'assistant',
            content: replyText,
            timestamp: new Date().toISOString(),
            metadata: { toolsUsed, referencedKUs }
        });

        return { reply: replyText, toolsUsed, referencedKUs };
    }

    /**
     * Scans text for potential Knowledge Unit slugs or characters.
     */
    private async detectEntity(text: string): Promise<ReferencedKU[]> {
        const refs: ReferencedKU[] = [];
        // Match Kanji characters or Slug patterns (e.g. k:word)
        const matches = text.match(/[A-Za-z0-9:-]+|[\u4e00-\u9faf]/g) || [];
        const uniqueMatches = Array.from(new Set(matches));

        for (const m of uniqueMatches) {
            if (m.length < 1) continue;
            if (refs.length >= 3) break; // Limit CTAs

            const { data } = await kuRepository.search(m, undefined, 1, 1);
            if (data && data.length > 0) {
                const k = data[0];
                if (!refs.find(r => r.id === k.id)) {
                    refs.push({
                        id: k.id,
                        slug: k.slug,
                        character: k.character,
                        type: k.type
                    });
                }
            }
        }
        return refs;
    }

    private async buildSystemContext(userId: string, intent: string): Promise<string> {
        let context = "You are Hanachan, an expert Japanese language tutor. ";
        context += "Help the user learn Japanese through immersion and clear explanations. ";
        context += "If you discuss a specific word or Kanji, use its exact slug or character from the database if provided.";

        context += await this.personaInjector.inject(userId);

        if (intent === 'PROJECT_QUERY') {
            context += await this.projectInjector.inject(userId);
        }

        return context;
    }
}

export const hanachan = new HanachanChatService();
