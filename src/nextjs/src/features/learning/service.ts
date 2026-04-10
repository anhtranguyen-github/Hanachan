import { backendClient } from '@/services/backendClient';
import { wanikaniClient } from '@/services/wanikaniClient';

/**
 * Submit a review using the new v2 API
 */
export async function submitReview(
  assignmentId: number,
  incorrectMeaningAnswers: number = 0,
  incorrectReadingAnswers: number = 0
) {
  return wanikaniClient.createReview({
    assignment_id: assignmentId,
    incorrect_meaning_answers: incorrectMeaningAnswers,
    incorrect_reading_answers: incorrectReadingAnswers
  });
}

export async function startReviewSession(limit: number = 20, contentType: string = 'all') {
  // Use v2 assignments for fetching due items
  const assignments = await wanikaniClient.listAssignments({
    immediately_available_for_review: true,
  });
  return assignments.data.slice(0, limit);
}

export async function startLessonSession(level?: number, deckId?: string) {
  // Use v2 assignments for fetching available lessons
  const assignments = await wanikaniClient.listAssignments({
    immediately_available_for_lessons: true,
    levels: level ? [level] : undefined,
  });
  return assignments.data;
}

export async function completeLessonSession(assignmentId: number) {
  // In v2, starting an assignment marks it as started.
  return wanikaniClient.startAssignment(assignmentId);
}

export async function fetchUserDashboardStats(deckId?: string) {
  // If a deckId is provided, we might want to fetch deck-specific stats
  // For now, we use the global summary
  const summary = await wanikaniClient.getSummary();
  
  // Map v2 summary to legacy DashboardStats structure for UI compatibility
  const now = new Date();
  const reviewsDue = summary.data.reviews
    .filter(r => new Date(r.available_at) <= now)
    .reduce((acc, r) => acc + r.subject_ids.length, 0);
  
  const lessonsAvailable = summary.data.lessons
    .filter(l => new Date(l.available_at) <= now)
    .reduce((acc, l) => acc + l.subject_ids.length, 0);

  return {
    reviewsDue,
    lessonsAvailable,
    nextReviewAt: summary.data.next_reviews_at,
    // Add other fields needed by the dashboard with fallback values
    retention: 0,
    streak: 0,
    reviewsToday: 0,
    totalBurned: 0,
    totalLearned: 0,
    forecast: {
      hourly: summary.data.reviews.map(r => ({
        time: r.available_at,
        count: r.subject_ids.length
      })),
      daily: []
    }
  };
}


