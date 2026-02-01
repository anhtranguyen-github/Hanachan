
import { OpenAI } from "openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { chatRepo } from './chat-repo';
import { ContextInjector, ProjectAwarenessInjector, PersonaInjector, SRSSimulatorInjector } from './injectors';
import { classifyIntent } from './chat-router';
import { sentenceService } from '../sentence/service';
import { sentenceRepository } from '../sentence/db';
import { kuRepository } from '@/features/knowledge/db';
import { ReferencedKU } from './simple-agent';


export class AdvancedChatService {
    private llm: ChatOpenAI;
    private personaInjector = new PersonaInjector();
    private projectInjector = new ProjectAwarenessInjector();
    private srsInjector = new SRSSimulatorInjector();

    constructor() {
        this.llm = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.7,
        });
    }

    /**
     * Main entry point.
     */
    async sendMessage(sessionId: string, userId: string, text: string): Promise<{ reply: string; actions: any[]; referencedKUs?: ReferencedKU[] }> {
        // 1. Session Management
        let session = await chatRepo.getSession(sessionId);
        if (!session) {
            session = await chatRepo.createSession(sessionId, userId);
        }
        const resolvedSessionId = session.id;

        // 2. Intent Classification
        const intent = classifyIntent(text);
        console.log(`🧭 Intent: ${intent}`);

        // 3. Routing & Logic
        if (intent === 'ANALYZE') {
            return await this.handleAnalysis(resolvedSessionId, userId, text);
        }

        // 4. Construct System Prompt (including Session Summary)
        const summary = session.summary || "No summary yet.";
        let systemContext = await this.buildSystemContext(userId, intent, summary);

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

        // Async Add Message
        await chatRepo.addMessage(resolvedSessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });

        const response = await chain.invoke({
            system_context: systemContext,
            history: history,
            input: text
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
            content: replyText,
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

    private extractContextActions(text: string, intent: string): any[] {
        const actions = [];

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

    private async buildSystemContext(userId: string, intent: string, summary: string): Promise<string> {
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
        context += await this.personaInjector.inject(userId);

        if (intent === 'PROJECT_QUERY') {
            context += await this.projectInjector.inject(userId);
        } else if (intent === 'SRS_SESSION') {
            const srsData = await this.srsInjector.inject(userId);
            context += srsData;
            context += `\n[INSTRUCTION]
             - The user wants a QUIZ.
             - Use the "Trouble Items" from the data above.
             - Ask one question at a time.
             - Wait for the user's answer before correcting.`;
        } else if (intent === 'STUDY_REQUEST') {
            const srsData = await this.srsInjector.inject(userId);
            context += srsData;
            context += `\n[INSTRUCTION]
            - The user wants to study but is vague.
            - PROPOSE a specific activity based on their Trouble Items.
            - Example: "You seem to struggle with [Item]. Shall we practice it?"
            - DO NOT start the quiz yet.`;
        }

        return context;
    }

    private async handleAnalysis(sessionId: string, userId: string, text: string): Promise<{ reply: string; actions: any[] }> {
        const cleanText = text.replace(/^(analyze|explain)( this)?[: ]*/i, "").trim();
        try {
            const result = await sentenceService.analyze(cleanText);

            // NEW: Auto-save analyzed sentence (Async Fix)
            const savedSentence = await sentenceRepository.create({
                text_ja: cleanText,
                text_en: result.translation,
                origin: 'chat',
                metadata: { sessionId },
                created_by: userId
            });

            const reply = `**Analysis Result** 🇯🇵
            
**Original:** ${result.raw_text}
**Meaning:** ${result.translation}

**Grammar Points:**
${result.grammar_points.length > 0 ? result.grammar_points.map(g => `- **${g.title}**: ${g.usage}`).join('\n') : "_No specific grammar points detected._"}

**Vocabulary Found (Known in Database):**
${result.units.length > 0 ? result.units.map((u: any) => `- [${u.text}]`).join('\n') : "_No known vocabulary references found._"}
`;

            const actions: any[] = [
                {
                    label: "View Breakdown",
                    type: 'analysis',
                    icon: 'Search',
                    data: { text: cleanText }
                },
                {
                    label: "Add to Deck",
                    type: 'add_vocab',
                    icon: 'Plus',
                    data: { surface: cleanText, meaning: result.translation }
                }
            ];

            // Add grammar actions
            result.grammar_points.forEach(g => {
                actions.push({
                    label: `Grammar: ${g.title}`,
                    type: 'grammar',
                    icon: 'BookOpen',
                    data: { name: g.title, meaning: g.usage, level: 'N5' }
                });
            });

            // Async Add Message
            await chatRepo.addMessage(sessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });
            await chatRepo.addMessage(sessionId, {
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString(),
                metadata: { actions }
            });

            return { reply, actions };
        } catch (e: any) {
            return { reply: `Error: ${e.message}`, actions: [] };
        }
    }
}

export const advancedChatService = new AdvancedChatService();
