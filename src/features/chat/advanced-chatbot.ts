import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { chatRepo } from './chat-repo';
import { ProjectAwarenessInjector, PersonaInjector } from './injectors';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { curriculumRepository } from '../knowledge/db';
import { AgentResponse, ReferencedUnit, ToolMetadata } from './types';
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

        const history = session.messages.map((m: any) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        // 2. Build System Context
        const systemContext = await this.buildSystemContext(userId, text);

        // 3. Execution Loop (Simple 1-step tool loop for speed)
        const messages = [
            new SystemMessage(systemContext),
            ...history,
            new HumanMessage(text)
        ];

        // First pass: AI decides to use tool or talk
        const firstResponse = await llmWithTools.invoke(messages);
        console.log(`🤖 AI Initial Thought: ${firstResponse.content || "[Calling Tool]"}`);

        let finalResponseText = "";

        if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
            console.log(`🛠️ Tool Calls: ${JSON.stringify(firstResponse.tool_calls)}`);
            // Execution of tool calls
            messages.push(firstResponse);
            for (const call of firstResponse.tool_calls) {
                const tool = tools.find((t) => t.name === call.name);
                if (tool) {
                    const result = await tool.invoke(call.args);
                    console.log(`📥 Tool Output for ${call.name}: ${result.substring(0, 100)}...`);
                    messages.push(new ToolMessage({ tool_call_id: call.id, content: result }));

                    // Parse results to CTAs and Metadata
                    if (call.name === "search_curriculum" && result !== "No results found in official curriculum.") {
                        const hits = JSON.parse(result);
                        isCurriculumBased = true;
                        toolsUsed.push({
                            toolName: 'search_curriculum',
                            status: 'hit',
                            resultSummary: `Found ${hits.length} items in curriculum.`
                        });
                        hits.forEach((h: any) => {
                            if (!referencedUnits.find(r => r.id === h.id)) {
                                referencedUnits.push({ id: h.id, slug: h.slug, character: h.character, type: h.type });
                            }
                        });
                    } else {
                        toolsUsed.push({ toolName: call.name, status: 'miss', resultSummary: "Reference not found in curriculum." });
                    }
                }
            }
            // Second pass: AI synthesizes final answer
            const secondResponse = await this.llm.invoke(messages);
            finalResponseText = secondResponse.content as string;
        } else {
            // AI didn't feel like searching
            finalResponseText = firstResponse.content as string;
        }

        // 4. Persistence
        await chatRepo.addMessage(resolvedSessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });
        await chatRepo.addMessage(resolvedSessionId, {
            role: 'assistant',
            content: finalResponseText,
            timestamp: new Date().toISOString(),
            metadata: { toolsUsed, referencedUnits, isCurriculumBased }
        });

        return { reply: finalResponseText, toolsUsed, referencedUnits, isCurriculumBased };
    }

    private async buildSystemContext(userId: string, text: string): Promise<string> {
        let context = `You are Hanachan, an expert Japanese tutor. 
        MANDATORY POLICY:
        1. YOU MUST ALWAYS CALL 'search_curriculum' if you need ANY specific information about Japanese words, kanji, or grammar to answer accurately.
        2. PROACTIVE SEARCH: Even if the user doesn't explicitly ask, if your intended answer mentions a Japanese term, you MUST search for it first.
        3. Prioritize 'search_curriculum' results over your general memory.
        4. If 'search_curriculum' returns "No results found", start with: "Lưu ý: Kiến thức này hiện nằm ngoài giáo trình chính thức của Hanachan."
        5. Your goal: Be an agent that verifies facts before speaking.`;

        context += await this.personaInjector.inject(userId);

        // Heuristic fallback for project awareness injection (efficient)
        if (text.toLowerCase().includes("project") || text.toLowerCase().includes("stack")) {
            context += await this.projectInjector.inject(userId);
        }

        return context;
    }
}

export const hanachan = new HanachanChatService();

