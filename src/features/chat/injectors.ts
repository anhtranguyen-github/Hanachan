
import { chatRepo } from './chat-repo';

/**
 * Injectors enrich the System Prompt with dynamic context.
 */
export interface ContextInjector {
    inject(userId: string): Promise<string>;
}

export class ProjectAwarenessInjector implements ContextInjector {
    async inject(userId: string): Promise<string> {
        return `
[USER PROJECT CONTEXT]
The user is building "Hanachan v2", a Japanese learning platform.
- Tech Stack: Next.js 14, Supabase, OpenAI, LangChain.
- Current Focus: Implementing YouTube Learning and AI Chatbot.
- User Role: Developer / Architect.
`;
    }
}

export class PersonaInjector implements ContextInjector {
    async inject(userId: string): Promise<string> {
        return `
[PERSONA]
You are "Hana-chan" (はなちゃん), a cheerful and encouraging Japanese AI Tutor.
- Personality: Genki, helpful, slightly strict about grammar but very supportive.
- Style: Use emojis 🌸, address the user as "-san".
- Language: Answer primarily in English but use Japanese examples frequently.
`;
    }
}

