import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { chatRepo } from './chat-repo';
import { ContextInjector, ProjectAwarenessInjector, PersonaInjector, SRSSimulatorInjector } from './injectors';
import { classifyIntent } from './chat-router';
import { sentenceService } from '../sentence/service';
import { sentenceRepository } from '../sentence/db';
import { kuRepository } from '@/features/knowledge/db';
import { ReferencedKU } from './simple-agent';
import { getMemoryContext } from '@/lib/memory-client';


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
            temperature: 0.3,
        });
    }

    /**
     * Main entry point.
     */
    async sendMessage(sessionId: string, userId: string, text: string): Promise<{ reply: string; actions: any[]; referencedKUs?: ReferencedKU[] }> {
        // 1. Session Management
        let session = await chatRepo.getSession(sessionId);
        if (!session) session = await chatRepo.createSession(sessionId, userId);
        const resolvedSessionId = session.id;

        // 2. Intent Classification
        const intent = classifyIntent(text);
        console.log(`🧭 Intent: ${intent}`);

        // 3. Routing & Logic
        if (intent === 'ANALYZE') {
            return await this.handleAnalysis(resolvedSessionId, userId, text);
        }

        // 4. Construct System Prompt (including Session Summary + Memory Context)
        const summary = session.summary || "No summary yet.";

        // Fetch memory context from the memory API (non-blocking if unavailable)
        let memoryContext = '';
        try {
            console.log(`🧠 Fetching memory context for user: ${userId}`);
            const ctx = await getMemoryContext(userId, text, resolvedSessionId, 5);
            memoryContext = ctx.system_prompt_block;
            console.log(`✅ Memory context retrieved (${memoryContext.length} chars)`);
        } catch (err: any) {
            console.error("❌ Memory context retrieval failed:", err.message);
            // Memory API offline — continue without it
        }

        let systemContext = await this.buildSystemContext(userId, intent, summary, memoryContext);


        // 5. Build LangChain Chain
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", "{system_context}"],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ]);

        const chain = promptTemplate.pipe(this.llm);

        // Principle 2: Only use 5-7 recent turns (let's use 6 messages = 3 turns for brevity, or 12 messages = 6 turns)
        const historyLimit = 12;
        const history = session.messages.slice(-historyLimit).map((m: any) =>
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

        let replyText = response.content as string;

        // --- Implicit Summary Update Handling ---
        // Extract updated summary if the LLM provided one in <session_summary> tags
        const summaryMatch = replyText.match(/<session_summary>([\s\S]*?)<\/session_summary>/);
        if (summaryMatch) {
            const newSummary = summaryMatch[1].trim();
            await chatRepo.updateSessionSummary(resolvedSessionId, newSummary);
            // Remove the summary from the reply sent to the user (NGẦM cập nhật)
            replyText = replyText.replace(/<session_summary>[\s\S]*?<\/session_summary>/, "").trim();
        }

        // Context-aware Action Extraction
        const actions = this.extractContextActions(replyText, intent);

        // --- AUTO LINK KU (CTA detection) ---
        const referencedKUs = await this.detectKUs(replyText);
        const referenced_ku_ids = referencedKUs.map(k => k.id);

        await chatRepo.addMessage(resolvedSessionId, {
            role: 'assistant',
            content: cleanReply,
            timestamp: new Date().toISOString(),
            metadata: { actions, referencedKUs },
        });

        // 6. Generate Title if this is the first exchange OR focus shifted
        if (session.messages.length <= 1 || summaryMatch) {
            const contextForTitle = summaryMatch ? summaryMatch[1] : text;
            this.generateAndStoreTitle(resolvedSessionId, contextForTitle).catch(err =>
                console.error("Delayed title gen failed:", err)
            );
        }

        return { reply: replyText, actions, referencedKUs };
    }

    private async generateAndStoreTitle(sessionId: string, context: string) {
        try {
            const prompt = `Based on this summary/request, create a very short, catchy title (max 5 words, no quotes) that reflects the CURRENT FOCUS.
            Context: "${context}"
            Title:`;

            const response = await this.llm.invoke([
                new SystemMessage("You are a helpful assistant that summarizes chat titles."),
                new HumanMessage(prompt)
            ]);

            const title = (response.content as string).trim();
            await chatRepo.updateSessionTitle(sessionId, title);
            console.log(`📝 Generated Title: ${title}`);
        } catch (error) {
            console.error("Failed to generate title:", error);
        }
    }

    private async buildSystemContext(userId: string, session: ChatSession, text: string): Promise<string> {
        let context = `You are Hanachan, an expert Japanese tutor...
MANDATORY POLICY:
1. ALWAYS call 'search_curriculum' for Japanese terms to be accurate.
2. Even if not asked, search for terms you intend to mention.
3. If search returns nothing, note: "Lưu ý: Kiến thức này hiện nằm ngoài giáo trình chính thức của Hanachan."
`;

        // Simple regex-based extractions for now (can be LLM-driven)
        if (text.includes("～") || text.includes("~")) {
            // Likely a grammar mention
            const grammarMatch = text.match(/([～~][^ ]+)/);
            if (grammarMatch) {
                actions.push({
                    label: `Grammar: ${grammarMatch[0]}`,
                    type: 'grammar',
                    icon: 'BookOpen',
                    data: { name: grammarMatch[0], meaning: 'Detected in chat' }
                });
            }
        }

        if (intent === 'STUDY_REQUEST' || intent === 'SRS_SESSION') {
            actions.push({
                label: "Quick Drill",
                type: 'drill',
                icon: 'Zap'
            });
        }

        return actions;
    }

    // Extraction logic from SimpleAgent, integrated here
    private async detectKUs(text: string): Promise<ReferencedKU[]> {
        const refs: ReferencedKU[] = [];
        const matches = text.match(/[A-Za-z0-9-]+|[\u4e00-\u9faf]/g) || [];
        const uniqueMatches = Array.from(new Set(matches));

        for (const m of uniqueMatches) {
            if (m.length < 1 || refs.length >= 3) break;

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

    private async buildSystemContext(userId: string, intent: string, summary: string, memoryContext = ''): Promise<string> {
        let context = `You are Hanachan, an expert Japanese language tutor.
        
### CONTEXT MANAGEMENT PRINCIPLES:
1. DO NOT rely on the entire conversation history. Use the provided Session Summary and recent turns.
2. The Session Summary is the "working state", not just a summary.
3. Always stick to the goals and decisions locked in the Session Summary.
4. Do not repeat explanations already locked in the summary unless asked.
5. Do not change architecture or assumptions without user approval.

### CURRENT SESSION SUMMARY:
${summary}

### UPDATE TRIGGER:
If the user:
- Locks a tech decision
- Rejects an approach
- Shifts focus to a new problem
Then:
1. Respond briefly.
2. Implicitly update the Session Summary by including it at the end of your response wrapped in <session_summary> tags.
3. The summary MUST follow this structure:
   - Mục tiêu hiện tại
   - Các quyết định đã chốt
   - Ràng buộc / nguyên tắc
   - Câu hỏi còn mở (nếu có)

If information is missing from the summary or recent turns, ASK the user instead of guessing.
Prioritize simple solutions and avoid over-engineering.
`;

        // Inject long-term memory context (from memory API)
        if (memoryContext) {
            context += `

### LONG-TERM MEMORY (PAST CONVERSATIONS & FACTS)
${memoryContext}

[PERSONALIZATION INSTRUCTION]
The information above in the "LONG-TERM MEMORY" section represents real past interactions or facts about the user. 
You MUST use this information to provide a personalized experience. 
If the user asks "Where do I live?" or "Who am I?", use the data from LONG-TERM MEMORY to answer accurately. 
Do not claim you don't have access to personal info if it is provided in the context block above.
`;
        }

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

