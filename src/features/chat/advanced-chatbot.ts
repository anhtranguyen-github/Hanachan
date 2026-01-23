
import { OpenAI } from "openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { chatRepo } from './chat-repo';
import { ContextInjector, ProjectAwarenessInjector, PersonaInjector, SRSSimulatorInjector } from './injectors';
import { classifyIntent } from './chat-router';
import { sentenceService } from '../sentence/service';
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { sentenceRepository } from '../sentence/db';


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
    async sendMessage(sessionId: string, userId: string, text: string): Promise<{ reply: string; actions: any[] }> {
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

        // 4. Construct System Prompt
        let systemContext = await this.buildSystemContext(userId, intent);

        // 5. Build LangChain Chain
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", "{system_context}"],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ]);

        const chain = promptTemplate.pipe(this.llm);

        const history = session.messages.map((m: any) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        // Async Add Message
        await chatRepo.addMessage(resolvedSessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });

        const response = await chain.invoke({
            system_context: systemContext,
            history: history,
            input: text
        });

        const replyText = response.content as string;

        // Context-aware Action Extraction
        const actions = this.extractContextActions(replyText, intent);

        await chatRepo.addMessage(resolvedSessionId, {
            role: 'assistant',
            content: replyText,
            timestamp: new Date().toISOString(),
            metadata: { actions }
        });

        return { reply: replyText, actions };
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

    private async buildSystemContext(userId: string, intent: string): Promise<string> {
        let context = "You are an advanced AI Tutor.";
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
