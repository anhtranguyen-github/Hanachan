import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { chatRepo } from './chat-repo';
import { ProjectAwarenessInjector, PersonaInjector } from './injectors';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { curriculumRepository } from '../knowledge/db';
import { AgentResponse, ReferencedUnit, ToolMetadata, ChatSession } from './types';
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

/**
 * HanachanChatService - The Agentic AI Assistant using Tool Use.
 * Synchronized with docs/uncertain/class-diagram/chatbot.md (V2)
 */
export class HanachanChatService {
    private llm: ChatOpenAI;
    private personaInjector = new PersonaInjector();
    private projectInjector = new ProjectAwarenessInjector();

    constructor() {
        this.llm = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.1, // Lower temperature for more consistent tool use
        });
    }

    private createTools() {
        return [
            new DynamicStructuredTool({
                name: "search_curriculum",
                description: "Search for a Japanese word, Kanji, Radical, or Grammar point in the official Hanachan curriculum. Returns details like meaning, reading, and mnemonics.",
                schema: z.object({
                    keyword: z.string().describe("The Japanese character or English meaning to search for."),
                }),
                func: async ({ keyword }) => {
                    console.log(`[HanachanChatService] Tool execution: search_curriculum("${keyword}")`);
                    let { data: results } = await curriculumRepository.search(keyword, undefined, 1, 3);

                    // Fallback: if no results and keyword is multiple words, try taking just the last word (likely the Japanese term)
                    if ((!results || results.length === 0) && keyword.includes(' ')) {
                        const words = keyword.split(' ');
                        const lastWord = words[words.length - 1];
                        console.log(`[HanachanChatService] No results for "${keyword}", trying fallback: "${lastWord}"`);
                        const { data: fallbackResults } = await curriculumRepository.search(lastWord, undefined, 1, 3);
                        results = fallbackResults;
                    }

                    if (!results || results.length === 0) {
                        console.log(`[HanachanChatService] No results found for "${keyword}"`);
                        return "No results found in official curriculum.";
                    }
                    return JSON.stringify(results.map(r => ({
                        id: r.id,
                        slug: r.slug,
                        type: r.type,
                        character: r.character,
                        meaning: r.meaning,
                        reading: r.vocabulary_details?.[0]?.reading || r.kanji_details?.[0]?.onyomi?.[0],
                        mnemonic: r.kanji_details?.[0]?.meaning_mnemonic || r.vocabulary_details?.[0]?.meaning_mnemonic
                    })));
                },
            }),
        ];
    }

    async process(sessionId: string, userId: string, text: string): Promise<AgentResponse> {
        const tools = this.createTools();
        const llmWithTools = this.llm.bindTools(tools);
        let toolsUsed: ToolMetadata[] = [];
        let referencedUnits: ReferencedUnit[] = [];
        let isCurriculumBased = false;

        // 1. Session & History
        let session = await chatRepo.getSession(sessionId);
        if (!session) session = await chatRepo.createSession(sessionId, userId);
        const resolvedSessionId = session.id;

        // ONLY use 6 recent messages (3 turns) + current message as requested (5-7 total turns recommended, we use 6 + 1 = 7 messages)
        const recentMessages = session.messages.slice(-6);
        const history = recentMessages.map((m: any) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        // 2. Build System Context
        const systemContext = await this.buildSystemContext(userId, session, text);

        // 3. Execution Loop
        const messages = [
            new SystemMessage(systemContext),
            ...history,
            new HumanMessage(text)
        ];

        // First pass: AI decides to use tool or talk
        const firstResponse = await llmWithTools.invoke(messages);

        let finalResponseText = "";

        if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
            messages.push(firstResponse);
            for (const call of firstResponse.tool_calls) {
                const tool = tools.find((t) => t.name === call.name);
                if (tool) {
                    const result = await tool.invoke(call.args);
                    messages.push(new ToolMessage({ tool_call_id: call.id, content: result }));

                    if (call.name === "search_curriculum" && result !== "No results found in official curriculum.") {
                        const hits = JSON.parse(result);
                        isCurriculumBased = true;
                        toolsUsed.push({
                            toolName: 'search_curriculum',
                            status: 'hit',
                            resultSummary: `Found ${hits.length} items.`
                        });
                        hits.forEach((h: any) => {
                            if (!referencedUnits.find(r => r.id === h.id)) {
                                referencedUnits.push({ id: h.id, slug: h.slug, character: h.character, type: h.type });
                            }
                        });
                    }
                }
            }
            const secondResponse = await this.llm.invoke(messages);
            finalResponseText = secondResponse.content as string;
        } else {
            finalResponseText = firstResponse.content as string;
        }

        // 4. Extract and Handle Metadata Updates (Summary/Title)
        let cleanReply = finalResponseText;
        const summaryMatch = finalResponseText.match(/\[\[SUMMARY_UPDATE\]\]([\s\S]*?)(\[\[|$)/);
        const titleMatch = finalResponseText.match(/\[\[TITLE_UPDATE\]\]([\s\S]*?)(\[\[|$)/);

        if (summaryMatch || titleMatch) {
            const updates: any = {};
            if (summaryMatch) updates.summary = summaryMatch[1].trim();
            if (titleMatch) updates.title = titleMatch[1].trim();

            await chatRepo.updateSession(resolvedSessionId, updates);

            // Clean up the reply for the user
            cleanReply = finalResponseText
                .replace(/\[\[SUMMARY_UPDATE\]\][\s\S]*?(\[\[TITLE_UPDATE\]\]|$)/, '')
                .replace(/\[\[TITLE_UPDATE\]\][\s\S]*?$/, '')
                .trim();
        }

        // 5. Persistence
        await chatRepo.addMessage(resolvedSessionId, {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        });
        await chatRepo.addMessage(resolvedSessionId, {
            role: 'assistant',
            content: cleanReply,
            timestamp: new Date().toISOString(),
            metadata: { toolsUsed, referencedUnits, isCurriculumBased }
        });

        return { reply: cleanReply, toolsUsed, referencedUnits, isCurriculumBased };
    }

    private async buildSystemContext(userId: string, session: ChatSession, text: string): Promise<string> {
        let context = `You are Hanachan, an expert Japanese tutor...
MANDATORY POLICY:
1. ALWAYS call 'search_curriculum' for Japanese terms to be accurate.
2. Even if not asked, search for terms you intend to mention.
3. If search returns nothing, note: "Lưu ý: Kiến thức này hiện nằm ngoài giáo trình chính thức của Hanachan."
`;

        context += await this.personaInjector.inject(userId);

        if (text.toLowerCase().includes("project") || text.toLowerCase().includes("stack")) {
            context += await this.projectInjector.inject(userId);
        }

        // CONTEXT MANAGEMENT (SUPER-DEV-PRO)
        context += `
[SESSION CONTEXT MANAGEMENT]
Current "Working State" (Session Summary):
${session.summary || "Mục tiêu: Bắt đầu hỗ trợ người dùng khám phá Hanachan."}

Rules:
1. Stick to the goals and decisions in the Session Summary.
2. Do NOT repeat explanations already settled in the Summary unless asked.
3. Do NOT change architecture or assumptions already decided.
4. If information is missing from Summary or history, ASK the user instead of guessing.

Implicit Update trigger:
If the user:
- Fixes/confirms a technical decision.
- Rejects an approach.
- Shifts focus to another topic.
Then provided a CONCISE response and append exactly:
[[SUMMARY_UPDATE]]
Mục tiêu hiện tại: ...
Các quyết định đã chốt: ...
Ràng buộc / nguyên tắc: ...
Câu hỏi còn mở (nếu có): ...
[[TITLE_UPDATE]]
(A short, descriptive title for the session)

Otherwise, do NOT include these tags.
`;

        return context;
    }
}

export const hanachan = new HanachanChatService();

