import {
  LLM_MODEL,
  LLM_PROVIDER,
  OMNIROUTE_API_KEY,
  OMNIROUTE_BASE_URL,
  OPENAI_API_BASE_URL,
  OPENAI_API_KEY,
} from '@/config/env';

export type LLMProvider = 'openai' | 'omniroute';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatInput = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

type ConnectionConfig = {
  provider: LLMProvider;
  apiKey: string;
  baseURL?: string;
  model: string;
};

class LLMClient {
  private readonly provider: LLMProvider;
  private readonly model: string;

  constructor(provider: LLMProvider = LLM_PROVIDER) {
    this.provider = provider;
    this.model = LLM_MODEL;
  }

  getConnectionInfo() {
    const config = this.getConfig();
    return {
      provider: config.provider,
      model: config.model,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
    };
  }

  async chat({ messages, model = this.model, temperature, maxTokens }: ChatInput) {
    const config = this.getConfig();
    const baseURL = config.baseURL || 'https://api.openai.com/v1';

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`LLM Chat error: ${response.statusText} ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async transcribeAudio(file: File, model = 'whisper-1') {
    const config = this.getConfig();
    const baseURL = config.baseURL || 'https://api.openai.com/v1';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);
    formData.append('response_format', 'text');

    const response = await fetch(`${baseURL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`LLM Transcription error: ${response.statusText} ${JSON.stringify(error)}`);
    }

    // Using text format as requested by formData
    const text = await response.text();
    return text;
  }

  private getConfig(): ConnectionConfig {
    if (this.provider === 'omniroute') {
      if (!OMNIROUTE_BASE_URL) {
        throw new Error('OMNIROUTE_BASE_URL or LLM_BASE_URL is required when LLM_PROVIDER=omniroute');
      }
      if (!OMNIROUTE_API_KEY) {
        throw new Error('OMNIROUTE_API_KEY or OPENAI_API_KEY is required when LLM_PROVIDER=omniroute');
      }

      return {
        provider: 'omniroute',
        apiKey: OMNIROUTE_API_KEY,
        baseURL: OMNIROUTE_BASE_URL,
        model: this.model,
      };
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    }

    return {
      provider: 'openai',
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_API_BASE_URL || undefined,
      model: this.model,
    };
  }
}

export const llmClient = new LLMClient();
export default llmClient;