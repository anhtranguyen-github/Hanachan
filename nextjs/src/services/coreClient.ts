import ServerApiClient from './serverApiClient';
import { CORE_API_BASE_URL } from '@/config/api';

/**
 * Client for interacting with the FastAPI Core service
 */
class CoreClient extends ServerApiClient {
  private baseRoute = CORE_API_BASE_URL;

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

  async startLessonSession(unitIds: string[]) {
    return this.post(`${this.baseRoute}/sessions/lesson/start`, { 
      unit_ids: unitIds 
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
}

export const coreClient = new CoreClient();
export default coreClient;
