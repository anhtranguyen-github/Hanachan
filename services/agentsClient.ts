import ServerApiClient from './serverApiClient';
import { AGENTS_BASE_URL } from '@/config/env';
import { 
  ChatRequest, 
  ChatResponse, 
  AgentSession, 
  CreateSessionRequest 
} from '@/types/chat';

/**
 * Client for interacting with the FastAPI Agents service
 */
class AgentsClient extends ServerApiClient {
  private baseRoute = `${AGENTS_BASE_URL}/api/v1`;

  /**
   * Send a chat message (non-streaming)
   */
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>(`${this.baseRoute}/chat`, payload);
  }

  /**
   * Create a new memory session
   */
  async createSession(payload: CreateSessionRequest = {}): Promise<AgentSession> {
    return this.post<AgentSession>(`${this.baseRoute}/memory/session`, payload);
  }

  /**
   * List memory sessions for current user
   */
  async listSessions(): Promise<AgentSession[]> {
    return this.get<AgentSession[]>(`${this.baseRoute}/memory/sessions`);
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<AgentSession> {
    return this.get<AgentSession>(`${this.baseRoute}/memory/session/${sessionId}`);
  }

  /**
   * End/Delete a session
   */
  async endSession(sessionId: string): Promise<{ title: string; summary: string }> {
    return this.delete<{ title: string; summary: string }>(`${this.baseRoute}/memory/session/${sessionId}`);
  }

  /**
   * Update session metadata
   */
  async updateSession(sessionId: string, payload: Partial<AgentSession>): Promise<AgentSession> {
    return this.patch<AgentSession>(`${this.baseRoute}/memory/session/${sessionId}`, payload);
  }
}

export const agentsClient = new AgentsClient();
export default agentsClient;
