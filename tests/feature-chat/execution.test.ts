
import { describe, it, expect, vi } from 'vitest';
import { chatService } from '../../src/features/chat/service';
import { openai } from '../../src/services/ai/openai-client';
import { sqlSearch } from '../../src/services/ai/sql-search';

// Mock AI Services
vi.mock('../../src/services/ai/openai-client', () => ({
  openai: {
    invoke: vi.fn()
  }
}));

vi.mock('../../src/services/ai/sql-search', () => ({
  sqlSearch: {
    search: vi.fn()
  }
}));

describe('Chat Service Execution', () => {
  it('should orchestrate RAG and OpenAI correctly', async () => {
    // Stage mock data
    (openai.invoke as any).mockResolvedValue({ content: 'Hana-chan response' });
    (sqlSearch.search as any).mockResolvedValue([]);

    const message = 'How is my progress?';
    const history = [] as any;
    const learning = {
      currentLevel: 5,
      troubleItems: ['ku_cat'],
      dueCount: 10,
      recentMistakes: []
    };
    const srsStates = {
      'ku_cat': { kuId: 'ku_cat', lapses: 5, difficulty: 8, state: 'Review' }
    };

    const result = await chatService.processMessage(message, history, learning, srsStates);

    expect(result.content).toBe('Hana-chan response');
    expect(result.intent).toBe('GENERAL_QUERY');
    expect(openai.invoke).toHaveBeenCalled();

    // Check if system prompt contained learning context
    const lastCall = (openai.invoke as any).mock.calls[0][0];
    const systemPrompt = lastCall[0].content;
    expect(systemPrompt).toContain('level: 5');
    expect(systemPrompt).toContain('ku_cat');
  });
});
