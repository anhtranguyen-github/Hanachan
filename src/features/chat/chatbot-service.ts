
import { openai } from '@/services/ai/openai-client';
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { localChatRepo, ChatMessage } from './local-db';
import { ContextInjector, ProjectAwarenessInjector, PersonaInjector, SRSSimulatorInjector } from './injectors';
import { classifyIntent, ChatIntent } from './chat-router';
import { sentenceService } from '../sentence/service';

export class AIChatbotService {
    // Injectors instance map
    private personaInjector = new PersonaInjector();
    private projectInjector = new ProjectAwarenessInjector();
    private srsInjector = new SRSSimulatorInjector();

    async sendMessage(sessionId: string, userId: string, text: string) {
        // 1. Get Session
        let session = localChatRepo.getSession(sessionId);
        if (!session) session = localChatRepo.createSession(sessionId, userId);

        // 2. Classify Intent
        const intent = classifyIntent(text);
        console.log(`🧭 Intent Detected: ${intent}`);

        // 3. Handle Special Intents
        if (intent === 'ANALYZE') return await this.handleAnalysis(sessionId, text);

        // 4. Dynamic Context Injection
        let systemPrompt = "You are an advanced AI Tutor.";
        systemPrompt += "\n" + await this.personaInjector.inject(userId); // Always inject Persona

        if (intent === 'PROJECT_QUERY') {
            systemPrompt += "\n" + await this.projectInjector.inject(userId);
        } else if (intent === 'STUDY_REQUEST' || intent === 'SRS_SESSION') {
            // Check SRS state first
            systemPrompt += "\n" + await this.srsInjector.inject(userId);
            if (intent === 'STUDY_REQUEST') {
                systemPrompt += "\n[INSTRUCTION] The user asks for study suggestions. Based on the SRS Status above, propose a specific activity (e.g. 'You have 5 trouble items. Should we review them?'). DO NOT start the quiz yet.";
            } else {
                systemPrompt += "\n[INSTRUCTION] The user explicitly wants a quiz. Start asking questions based on the SRS Status.";
            }
        }

        // 5. Send to AI
        return await this.handleStandardChat(sessionId, systemPrompt, text, session.messages);
    }

    private async handleAnalysis(sessionId: string, text: string) {
        const cleanText = text.replace(/^(analyze|explain)( this)?[: ]*/i, "").trim();
        try {
            const result = await sentenceService.analyze(cleanText);
            const response = `**Analysis Result** 🇯🇵\n\n**Original:** ${result.raw_text}\n**Meaning:** ${result.translation}\n\n**Grammar:**\n${result.grammar_points.map(g => `- ${g.title}: ${g.meaning}`).join('\n')}`;

            this.saveExchange(sessionId, text, response);
            return response;
        } catch (e: any) {
            return `Sorry, error analyzing: ${e.message}`;
        }
    }

    private async handleStandardChat(sessionId: string, systemPrompt: string, text: string, history: any[]) {
        const messages = [
            new SystemMessage(systemPrompt),
            ...history.map((m: any) => m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)),
            new HumanMessage(text)
        ];

        localChatRepo.addMessage(sessionId, { role: 'user', content: text, timestamp: new Date().toISOString() });
        console.log("🤖 Hana-chan is thinking...");

        const response = await openai.invoke(messages);
        const replyText = response.content as string;

        localChatRepo.addMessage(sessionId, { role: 'assistant', content: replyText, timestamp: new Date().toISOString() });
        return replyText;
    }

    private saveExchange(sessionId: string, userText: string, aiText: string) {
        localChatRepo.addMessage(sessionId, { role: 'user', content: userText, timestamp: new Date().toISOString() });
        localChatRepo.addMessage(sessionId, { role: 'assistant', content: aiText, timestamp: new Date().toISOString() });
    }
}

export const aiChatbotService = new AIChatbotService();
