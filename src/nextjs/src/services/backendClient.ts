import ServerApiClient from './serverApiClient';
import { BACKEND_API_BASE_URL } from '@/config/api';

/**
 * Client for interacting with the FastAPI backend
 */
class BackendClient extends ServerApiClient {
  private baseRoute = BACKEND_API_BASE_URL;

  async startReviewSession(limit: number = 20, contentType: string = 'all') {
    return this.post(`${this.baseRoute}/sessions/review/start`, { 
      limit, 
      content_type: contentType 
    });
  }

  async submitReview(payload: {
    sessionId: string;
    kuId: string;
    facet: string;
    rating: string;
    attemptCount: number;
    wrongCount: number;
  }) {
    return this.post(`${this.baseRoute}/sessions/review/${payload.sessionId}/submit`, {
      ku_id: payload.kuId,
      facet: payload.facet,
      rating: payload.rating,
      attempt_count: payload.attemptCount,
      wrong_count: payload.wrongCount
    });
  }

  async startLessonSession(unitIds: string[], level?: number, deckId?: string) {
    return this.post(`${this.baseRoute}/sessions/lesson/start`, { 
      unit_ids: unitIds,
      level: level,
      deck_id: deckId
    });
  }

  async completeLessonSession(batchId: string) {
    return this.post(`${this.baseRoute}/sessions/lesson/${batchId}/complete`, {});
  }

  async getLearningProgress(identifier: string) {
    return this.get(`${this.baseRoute}/learning/progress`, { 
      params: { identifier } 
    });
  }

  async getDashboardStats() {
    return this.get(`${this.baseRoute}/learning/dashboard`);
  }

  async submitReviewV2(payload: {
    kuId: string;
    facet: string;
    rating: string;
    wrongCount?: number;
  }) {
    return this.post(`${this.baseRoute}/learning/review`, {
      ku_id: payload.kuId,
      facet: payload.facet,
      rating: payload.rating,
      wrong_count: payload.wrongCount ?? 0
    });
  }

  async submitReadingAnswer(payload: {
    exerciseId: string;
    questionIndex: number;
    userAnswer: string;
    timeSpent?: number;
  }) {
    return this.post(`${this.baseRoute}/reading/submit-answer`, {
      exercise_id: payload.exerciseId,
      question_index: payload.questionIndex,
      user_answer: payload.userAnswer,
      time_spent_seconds: payload.timeSpent ?? 0
    });
  }

  // Deck Management APIs
  async listDecks() {
    return this.get(`${this.baseRoute}/decks`);
  }

  async toggleDeck(deckId: string, enabled: boolean) {
    return this.post(`${this.baseRoute}/learning/decks/${deckId}/toggle`, { enabled });
  }

  async createDeck(name: string, description?: string) {
    return this.post(`${this.baseRoute}/decks`, { name, description });
  }

  async getDeckDashboard(deckId?: string) {
    return this.get(`${this.baseRoute}/learning/dashboard`, {
      params: deckId ? { deck_id: deckId } : {}
    });
  }

  async getDeck(deckId: string) {
    return this.get(`${this.baseRoute}/decks/${deckId}`);
  }

  async deleteDeck(deckId: string) {
    return this.delete(`${this.baseRoute}/decks/${deckId}`);
  }
}

export const backendClient = new BackendClient();
export default backendClient;
