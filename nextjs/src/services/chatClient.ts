import ApiClient from './apiClient';
import { ChatRequest } from '@/types/chat';

/**
 * Client for specialized Chat operations (browser-side)
 */
class ChatClient extends ApiClient {
  /**
   * Browser-side: Streams chat response via BFF API route
   */
  async streamChat(payload: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch('/api/agent/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !res.body) {
      throw new Error('Failed to start chat stream');
    }

    return res.body;
  }

  /**
   * Browser-side: Transcribes audio via BFF API route
   */
  async transcribe(formData: FormData): Promise<{ success: boolean; transcript?: string; error?: string }> {
    const res = await fetch('/api/chat/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Transcription failed');
    }

    return res.json();
  }
}

export const chatClient = new ChatClient();
export default chatClient;
