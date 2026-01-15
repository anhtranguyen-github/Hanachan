
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
import { sentenceRepo } from '../sentence/sentence-repo'; // Updated to new repo


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
    async sendMessage(sessionId: string, userId: string, text: string) {
        // 1. Session Management
        let session = await chatRepo.getSession(sessionId);
        if (!session) {
            session = await chatRepo.createSession(sessionId, userId);
        }

        // 2. Intent Classification
        const intent = classifyIntent(text);
        console.log(`🧭 Intent: ${intent}`);

        // 3. Routing & Logic
        if (intent === 'ANALYZE') {
            return await this.handleAnalysis(sessionId, userId, text);
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
        await chatRepo.addMessage(sessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });

        const response = await chain.invoke({
            system_context: systemContext,
            history: history,
            input: text
        });

        const replyText = response.content as string;
        await chatRepo.addMessage(sessionId, { role: 'assistant', content: replyText, timestamp: new Date().toISOString() });

        return replyText;
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

    private async handleAnalysis(sessionId: string, userId: string, text: string) {
        const cleanText = text.replace(/^(analyze|explain)( this)?[: ]*/i, "").trim();
        try {
            const result = await sentenceService.analyze(cleanText);

            // NEW: Auto-save analyzed sentence (Async Fix)
            const savedSentence = await sentenceRepo.addSentence({
                text: cleanText,
                translation: result.translation,
                sourceType: 'chat',
                sourceId: sessionId,
                userId: userId
            });

            const response = `**Analysis Result** 🇯🇵
            
**Original:** ${result.raw_text}
**Meaning:** ${result.translation}

**Grammar Points:**
${result.grammar_points.map(g => `- **${g.title}**: ${g.meaning}`).join('\n')}

**Vocabulary Breakdown:**
${result.units.filter(u => u.type === 'vocabulary').map(u => `- ${u.surface} (${u.reading}): ${u.pos}`).join('\n')}

[ACTION_TRIGGER]: {"type": "PROPOSE_MINING", "sentenceId": "${savedSentence.id}"}
`;

            // Async Add Message
            await chatRepo.addMessage(sessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });
            await chatRepo.addMessage(sessionId, { role: 'assistant', content: response, timestamp: new Date().toISOString() });

            return response;
        } catch (e: any) {
            return `Error: ${e.message}`;
        }
    }
}

export const advancedChatService = new AdvancedChatService();
