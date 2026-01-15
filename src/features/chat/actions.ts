
'use server';

import { advancedChatService } from './advanced-chatbot';
import { chatRepo } from './chat-repo';
import { z } from 'zod';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getAuthUser() {
    // Mock user for development
    return { id: MOCK_USER_ID };
}

/**
 * Server Action to send a message to the AI.
 */
export async function sendMessageAction(sessionId: string, content: string) {
    // 0. Validation
    z.string().min(1).parse(sessionId);
    z.string().min(1).parse(content);

    const user = await getAuthUser();

    // Always use mock replies or simple agent logic in this phase
    try {
        const reply = await advancedChatService.sendMessage(sessionId, user.id, content);
        return { success: true, reply };
    } catch (error: any) {
        console.error("Chat Action Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action to load session history.
 */
export async function getSessionHistoryAction(sessionId: string) {
    return await chatRepo.getSession(sessionId);
}

/**
 * Server Action to load all sessions for a user.
 */
export async function getUserSessionsAction() {
    const user = await getAuthUser();
    return await chatRepo.getUserSessions(user.id);
}

export async function createSessionAction(sessionId: string) {
    const user = await getAuthUser();
    return await chatRepo.createSession(sessionId, user.id);
}
