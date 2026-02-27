
'use server';

import { advancedChatService } from './advanced-chatbot';
import { chatRepo } from './chat-repo';
import { z } from 'zod';

/**
 * Server Action to send a message to the AI.
 */
export async function sendMessageAction(sessionId: string, userId: string, content: string) {
    // 0. Validation
    z.string().min(1).parse(sessionId);
    z.string().min(1).parse(userId);
    z.string().min(1).parse(content);

    try {
        const result = await advancedChatService.sendMessage(sessionId, userId, content);
        return { success: true, ...result };
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
export async function getUserSessionsAction(userId: string) {
    return await chatRepo.getUserSessions(userId);
}

export async function createSessionAction(sessionId: string, userId: string) {
    return await chatRepo.createSession(sessionId, userId);
}
