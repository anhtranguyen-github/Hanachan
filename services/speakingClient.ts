import ApiClient from './apiClient';

/**
 * Client for speaking practice and speech services
 */
class SpeakingClient extends ApiClient {
  async getSpeechToken(): Promise<{ token: string; region: string }> {
    return this.get<{ token: string; region: string }>('/api/speech-token');
  }

  async createSession(level: number, topics?: string[]): Promise<any> {
    return this.post<any>('/api/practice/session', {
      level,
      topics,
      target_difficulty: topics && topics.length > 0 ? topics[0] : undefined
    });
  }


  async recordAttempt(sessionId: string, attempt: any): Promise<any> {
    return this.post<any>(`/api/practice/session/${sessionId}/record`, attempt);
  }

  async completeSession(sessionId: string): Promise<any> {
    return this.patch<any>(`/api/practice/session/${sessionId}`, { status: 'completed' });
  }
}

export const speakingClient = new SpeakingClient();
export default speakingClient;
