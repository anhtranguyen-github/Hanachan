import ServerApiClient from './serverApiClient';
import { AGENTS_BASE_URL } from '@/config/env';

/**
 * Client for Sentence-related operations (server-side)
 */
class SentenceClient extends ServerApiClient {
  private baseRoute = `${AGENTS_BASE_URL}/api/v1`;

  /**
   * Annotate a sentence via Agents API
   */
  async annotate(sentenceId: string, japaneseRaw: string): Promise<any> {
    // Note: This matches the structure expected by the backend
    return this.post(`${this.baseRoute}/sentences/annotate`, {
      sentence_id: sentenceId,
      japanese_raw: japaneseRaw,
    });
  }
}

export const sentenceClient = new SentenceClient();
export default sentenceClient;
