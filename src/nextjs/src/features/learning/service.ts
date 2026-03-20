import { backendClient } from '@/services/backendClient';

export async function submitReview(
  sessionId: string,
  unitId: string,
  facet: string,
  rating: string,
  attemptCount: number,
  wrongCount: number,
) {
  return backendClient.submitReview({
    sessionId,
    kuId: unitId,
    facet,
    rating,
    attemptCount,
    wrongCount,
  });
}

export async function startReviewSession(limit: number = 20, contentType: string = 'all') {
  return backendClient.startReviewSession(limit, contentType);
}

export async function startLessonSession(unitIds: string[], level?: number, deckId?: string) {
  return backendClient.startLessonSession(unitIds, level, deckId);
}

export async function completeLessonSession(batchId: string) {
  return backendClient.completeLessonSession(batchId);
}

export async function fetchUserDashboardStats(deckId?: string) {
  return backendClient.getDeckDashboard(deckId);
}


