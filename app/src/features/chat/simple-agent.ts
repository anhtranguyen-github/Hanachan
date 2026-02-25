import { kuRepository } from '@/features/knowledge/db';
import { analyzeSentenceAction } from '@/features/sentence/actions';
import { fetchUserDashboardStats } from '../learning/service';

// Skill: prompt-engineering-patterns (Role-Based)
const SYSTEM_PROMPT = `You are Hanachan, an expert Japanese language tutor.
Your goal is to help users learn Japanese through immersion and analysis.

Capabilities:
1. Vocabulary Search: You can find words in the user's knowledge base.
2. Sentence Analysis: You can break down Japanese sentences grammatically.
3. Progress Tracking: You can tell users about their studies (due items, level, etc).
4. Conversation: You can chat in English or Japanese to practice.

Response Style:
- Be encouraging and helpful.
- When explaining grammar, use simple terms first, then technical ones.
- If the user asks for a word, search the knowledge base.
`;

export interface ReferencedKU {
    id: string;
    slug: string;
    character: string;
    type: string;
}

export interface AgentResponse {
    reply: string;
    toolsUsed: string[];
    referencedKUs?: ReferencedKU[];
}

export class SimpleAgent {

    // Skill: langchain-architecture (Agent Pattern - Simplified for zero-dep)
    async process(message: string, history: any[], userId?: string): Promise<AgentResponse> {
        const toolsUsed: string[] = [];
        let reply = "";

        // 1. REASONING / ROUTING (Heuristic-based "Supervisor" Node)
        const intent = this.determineIntent(message);

        // 2. TOOL EXECUTION
        if (intent === 'SEARCH') {
            toolsUsed.push('knowledge_base_search');
            const keyword = message.replace(/search|find|lookup|for/gi, '').trim();
            const { data: results } = await kuRepository.search(keyword);

            if (results && results.length > 0) {
                const top = results.slice(0, 3);
                reply = `I found ${results.length} matches in your knowledge base.\n\n` +
                    top.map(k => `• **${k.slug}** (${k.type}): ${k.meaning}`).join('\n');
            } else {
                reply = `I couldn't find "${keyword}" in your knowledge base. You might want to mine it from a video!`;
            }

        } else if (intent === 'PROGRESS' && userId) {
            toolsUsed.push('progress_tracker');
            const stats = await fetchUserDashboardStats(userId);
            reply = `Sure! Here is your current status:\n\n` +
                `• **Current Level**: ${stats.due === 0 && stats.learned === 0 ? 'Evaluating' : 'Level 1'}\n` +
                `• **Items Due**: ${stats.due}\n` +
                `• **Learned Items**: ${stats.learned}\n\n` +
                `You are doing great! Keep up the momentum.`;

        } else if (intent === 'ANALYZE') {
            toolsUsed.push('sentence_analyzer');
            const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(message);
            const targetText = hasJapanese ? message : "こんにちは";

            const analysis = await analyzeSentenceAction(targetText);

            if (analysis.success && analysis.data) {
                if (analysis.data.units && analysis.data.units.length > 0) {
                    const tokens = analysis.data.units.map(t => `[${t.text}]`).join(' + ');
                    reply = `Here are the units found:\n\n**${tokens}**\n\n(Deep grammatical analysis has been disabled)`;
                } else {
                    reply = "Analysis is currently unavailable (Feature disabled).";
                }
            } else {
                reply = "I had trouble analyzing that sentence.";
            }

        } else {
            // Default Chat
            reply = await this.mockLLMResponse(message);
            if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
                toolsUsed.push('llm_generation');
            }
        }

        // 3. POST-PROCESSING: Entity Extraction (CTA Link Detection)
        const referencedKUs = await this.detectKUs(reply);

        return { reply, toolsUsed, referencedKUs };
    }

    private determineIntent(msg: string): 'SEARCH' | 'PROGRESS' | 'ANALYZE' | 'CHAT' {
        const lower = msg.toLowerCase();
        if (lower.includes('search') || lower.includes('find') || lower.includes('lookup')) return 'SEARCH';
        if (lower.includes('progress') || lower.includes('how am i') || lower.includes('status') || lower.includes('stats')) return 'PROGRESS';
        if (lower.includes('analyze') || lower.includes('break down') || lower.includes('grammar')) return 'ANALYZE';
        return 'CHAT';
    }

    // Heuristic entity detector for providing CTAs
    private async detectKUs(text: string): Promise<ReferencedKU[]> {
        const refs: ReferencedKU[] = [];
        // Extract anything that looks like a slug or single kanji
        const matches = text.match(/[A-Za-z0-9-]+|[\u4e00-\u9faf]/g) || [];
        const uniqueMatches = Array.from(new Set(matches));

        for (const m of uniqueMatches) {
            if (m.length < 1) continue;
            // Limit searches to prevent perf issues
            if (refs.length >= 2) break;

            const { data } = await kuRepository.search(m, undefined, 1, 1);
            if (data && data.length > 0) {
                const k = data[0];
                // Only add if not already in list
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

    private async mockLLMResponse(msg: string): Promise<string> {
        await new Promise(r => setTimeout(r, 800));
        const lower = msg.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi')) return "Konnichiwa! Genki desu ka? (Hello! How are you?)";
        if (lower.includes('thank')) return "Douitashimashite! (You're welcome!)";
        if (lower.includes('bye')) return "Sayonara! See you next time.";

        return "I am running in 'Offline Mode' because the LLM API key wasn't found. \n\nTry asking me to:\n• 'How am I doing?' (Progress Tracking)\n• 'Search for cat'\n• 'Analyze 私は猫です'";
    }
}

export const chatAgent = new SimpleAgent();
