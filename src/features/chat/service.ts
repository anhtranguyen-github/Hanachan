import { openai } from '@/services/ai/openai-client';
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { classifyIntent } from './chat-router';
import { buildEnrichedContext, LearningContext } from './context-enabler';
import { sqlSearch } from '@/services/ai/sql-search';
import { rerankResults } from './retrieval-logic';
import { formatRAGContext, shouldAugment } from './rag-strategy';
import { ChatMessage } from './context-manager';
import { SRSStateSnapshot } from './recommendation-engine';

export class ChatService {
    /**
     * Main entry point for processing a chat message.
     * Orchestrates the RAG and LLM flow.
     */
    async processMessage(
        message: string,
        history: ChatMessage[],
        learning: LearningContext,
        srsStates: Record<string, SRSStateSnapshot>
    ) {
        // 1. Classify Intent
        const intent = classifyIntent(message);

        // 2. Build Base Context
        const context = buildEnrichedContext(history, learning);

        // 3. RAG Retrieval (If applicable)
        let augmentedContext = "";
        if (intent === 'GENERAL_QUERY' || intent === 'SENTENCE_ANALYSIS') {
            const initialResults = await sqlSearch.search(message);
            const reranked = rerankResults(initialResults, srsStates);

            const scores = reranked.map(r => r.score);
            if (shouldAugment(scores)) {
                augmentedContext = formatRAGContext(reranked.map(r => r.ku));
            }
        }

        // 4. Prepare LangChain Messages
        const finalSystemPrompt = context.systemPrompt + (augmentedContext ? `\n\n${augmentedContext}` : "");

        const langchainMessages: any[] = [
            new SystemMessage(finalSystemPrompt),
            ...context.messages.map(m =>
                m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
            ),
            new HumanMessage(message)
        ];

        // 5. Execute OpenAI Call
        const response = await openai.invoke(langchainMessages);

        return {
            content: response.content,
            intent,
            augmented: !!augmentedContext
        };
    }
}

export const chatService = new ChatService();
