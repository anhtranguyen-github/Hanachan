import ApiClient from './apiClient';
import { 
  ChatRequest, 
  AgentSession, 
  CreateSessionRequest 
} from '@/types/chat';

/**
 * Client for browser-side interactions via Next.js BFF pathways
 */
class BrowserAgentsClient extends ApiClient {
  /**
   * Create a new conversation thread via BFF
   */
  async createThread(payload: CreateSessionRequest = {}): Promise<AgentSession> {
    return this.post<AgentSession>('/api/thread/session', payload);
  }

  /**
   * List user threads via BFF
   */
  async listThreads(): Promise<AgentSession[]> {
    return this.get<AgentSession[]>('/api/thread/sessions');
  }

  /**
   * Get thread details via BFF
   */
  async getThread(sessionId: string): Promise<AgentSession> {
    return this.get<AgentSession>(`/api/thread/session/${encodeURIComponent(sessionId)}`);
  }

  /**
   * Update thread metadata via BFF
   */
  async updateThread(sessionId: string, updates: Partial<AgentSession>): Promise<void> {
    return this.patch<void>(`/api/thread/session/${encodeURIComponent(sessionId)}`, updates);
  }

  /**
   * Delete thread via BFF
   */
  async deleteThread(sessionId: string): Promise<{ title: string | null; summary: string | null }> {
    return this.delete<{ title: string | null; summary: string | null }>(
      `/api/thread/session/${encodeURIComponent(sessionId)}`
    );
  }
}

export const browserAgentsClient = new BrowserAgentsClient();
export default browserAgentsClient;
