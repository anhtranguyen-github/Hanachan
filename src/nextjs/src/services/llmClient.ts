import OpenAI from 'openai';

import {
  LLM_MODEL,
  LLM_PROVIDER,
  OMNIROUTE_API_KEY,
  OMNIROUTE_BASE_URL,
  OPENAI_API_BASE_URL,
  OPENAI_API_KEY,
} from '@/config/env';

export type LLMProvider = 'openai' | 'omniroute';

type ChatInput = {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
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
  private client: OpenAI | null = null;
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
    const client = this.getClient();
    return client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
  }

  async transcribeAudio(file: File, model = 'whisper-1') {
    const client = this.getClient();
    return client.audio.transcriptions.create({
      file,
      model,
      response_format: 'text',
    });
  }

  private getClient() {
    if (!this.client) {
      const config = this.getConfig();
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
    }

    return this.client;
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