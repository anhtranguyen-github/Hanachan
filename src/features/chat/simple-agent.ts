import { kbService } from '@/features/knowledge/kb-service';
import { analyzeSentenceAction } from '@/features/sentence/actions';

// Skill: prompt-engineering-patterns (Role-Based)
const SYSTEM_PROMPT = `You are Hanachan, an expert Japanese language tutor.
Your goal is to help users learn Japanese through immersion and analysis.

Capabilities:
1. Vocabulary Search: You can find words in the user's knowledge base.
2. Sentence Analysis: You can break down Japanese sentences grammatically.
3. Conversation: You can chat in English or Japanese to practice.

Response Style:
- Be encouraging and helpful.
- When explaining grammar, use simple terms first, then technical ones.
- If the user asks for a word, search the knowledge base.
`;

interface AgentResponse {
    reply: string;
    toolsUsed: string[];
}

export class SimpleAgent {

    // Skill: langchain-architecture (Agent Pattern - Simplified for zero-dep)
    async process(message: string, history: any[]): Promise<AgentResponse> {
        const toolsUsed: string[] = [];
        let reply = "";

        // 1. REASONING / ROUTING (Heuristic-based "Supervisor" Node)
        const intent = this.determineIntent(message);

        // 2. TOOL EXECUTION
        if (intent === 'SEARCH') {
            toolsUsed.push('knowledge_base_search');
            // Extract keyword (naive)
            const keyword = message.replace(/search|find|lookup|for/gi, '').trim();
            const results = kbService.search({ search: keyword });

            if (results.length > 0) {
                const top = results.slice(0, 3);
                reply = `I found ${results.length} matches in your knowledge base.\n\n` +
                    top.map(k => `• **${k.slug}** (${k.type}): ${k.meanings.join(', ')}`).join('\n');
            } else {
                reply = `I couldn't find "${keyword}" in your knowledge base. You might want to mine it from a video!`;
            }

        } else if (intent === 'ANALYZE') {
            toolsUsed.push('sentence_analyzer');
            // Extract Japanese text (naively assume it's the non-english part or just the whole thing if short)
            // For now, let's just analyze the whole message if it has Japanese chars
            const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(message);
            const targetText = hasJapanese ? message : "こんにちは"; // Sentinel

            const analysis = await analyzeSentenceAction(targetText);

            if (analysis.success && analysis.data) {
                const tokens = analysis.data.tokens.map(t => `${t.surface_form} (${t.pos})`).join(' + ');
                reply = `Here is the breakdown of the sentence:\n\n**${tokens}**\n\n(Detailed analysis is available on the Analyze page)`;
            } else {
                reply = "I had trouble analyzing that sentence.";
            }

        } else {
            // Default Chat (Fallback to simple logic or check for API Key)
            if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
                toolsUsed.push('llm_generation');
                // Real LLM call would go here
                // For this demo, since we failed to install SDKs, we simulate a response
                reply = await this.mockLLMResponse(message);
            } else {
                reply = await this.mockLLMResponse(message);
            }
        }

        return { reply, toolsUsed };
    }

    private determineIntent(msg: string): 'SEARCH' | 'ANALYZE' | 'CHAT' {
        const lower = msg.toLowerCase();
        if (lower.includes('search') || lower.includes('find') || lower.includes('lookup')) return 'SEARCH';
        if (lower.includes('analyze') || lower.includes('break down') || lower.includes('grammar')) return 'ANALYZE';
        return 'CHAT';
    }

    private async mockLLMResponse(msg: string): Promise<string> {
        // Simulate thinking time
        await new Promise(r => setTimeout(r, 800));

        const lower = msg.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi')) return "Konnichiwa! Genki desu ka? (Hello! How are you?)";
        if (lower.includes('thank')) return "Douitashimashite! (You're welcome!)";
        if (lower.includes('bye')) return "Sayonara! See you next time.";

        return "I am running in 'Offline Mode' because the LLM API key wasn't found or packages could not be installed. \n\nHowever, my **Tools** are active! Try asking me to:\n• 'Search for cat'\n• 'Analyze 私は猫です'";
    }
}

export const chatAgent = new SimpleAgent();
