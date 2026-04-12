import { backendClient } from '@/services/backendClient';
import { wanikaniClient } from '@/services/wanikaniClient';
import { AssignmentResource } from '@/types/wanikani';

function parseDeckId(deckId?: string): string | null {
  return deckId || null;
}

async function buildCustomDeckLessonAssignments(deckId: string): Promise<AssignmentResource[]> {
  const numericDeckId = parseDeckId(deckId);
  if (!numericDeckId) return [];

  const [deck, deckItems] = await Promise.all([
    wanikaniClient.getDeck(numericDeckId),
    wanikaniClient.listDeckItems(numericDeckId),
  ]);

  const currentLevel = deck.data.current_level;
  const lessonItemIds = deckItems.data
    .filter((item) => item.data.custom_level === currentLevel)
    .map((item) => item.data.subject_id);

  if (lessonItemIds.length === 0) return [];

  const subjects = await wanikaniClient.listSubjects({ ids: lessonItemIds });
  const subjectsById = new Map(subjects.data.map((subject) => [subject.id, subject]));
  const lessonLimit = deck.data.config?.lessons_per_session ?? lessonItemIds.length;

  return lessonItemIds.slice(0, lessonLimit).flatMap((subjectId) => {
    const subject = subjectsById.get(subjectId);
    if (!subject) return [];

    return [{
      id: `cd-${numericDeckId}-${subjectId}`,
      object: 'assignment',
      url: `${deck.url}/items/${subjectId}`,
      data_updated_at: subject.data_updated_at,
      data: {
        available_at: null,
        burned_at: null,
        created_at: subject.data.created_at,
        hidden: false,
        passed_at: null,
        resurrected_at: null,
        srs_stage: 0,
        started_at: null,
        subject_id: subject.id,
        subject_type: subject.object as AssignmentResource['data']['subject_type'],
        unlocked_at: subject.data.created_at,
        subject,
      },
    } satisfies AssignmentResource];
  });
}

async function buildCustomDeckReviewAssignments(deckId: string): Promise<AssignmentResource[]> {
  const numericDeckId = parseDeckId(deckId);
  if (!numericDeckId) return [];

  const deckReviews = await wanikaniClient.listDeckReviews(numericDeckId);
  const subjectIds = deckReviews.data.map((item) => item.data.subject_id);
  if (subjectIds.length === 0) return [];

  const subjects = await wanikaniClient.listSubjects({ ids: subjectIds as (number | string)[] });
  
  const filteredSubjects = subjects.data.filter((subject) => (subjectIds as any).includes(subject.id));
  const subjectsById = new Map(filteredSubjects.map((subject) => [subject.id, subject]));

  return deckReviews.data.flatMap((progress) => {
    const subject = subjectsById.get(progress.data.subject_id);
    if (!subject) return [];

    return [{
      id: `cd-${numericDeckId}-${progress.data.subject_id}`,
      object: 'assignment',
      url: `${progress.url}`,
      data_updated_at: progress.data_updated_at,
      data: {
        available_at: progress.data.custom_next_review_at,
        burned_at: null,
        created_at: subject.data.created_at,
        hidden: false,
        passed_at: null,
        resurrected_at: null,
        srs_stage: progress.data.custom_stage,
        started_at: subject.data.created_at,
        subject_id: subject.id,
        subject_type: subject.object as AssignmentResource['data']['subject_type'],
        unlocked_at: subject.data.created_at,
        subject,
      },
    } satisfies AssignmentResource];
  });
}

/**
 * Submit a review using the new v2 API
 */
export async function submitReview(
  assignmentId: number | string,
  incorrectMeaningAnswers: number = 0,
  incorrectReadingAnswers: number = 0,
  deckId?: string,
  subjectId?: number | string,
) {
  const numericDeckId = parseDeckId(deckId);
  if (numericDeckId && subjectId) {
    return wanikaniClient.createDeckReview(numericDeckId, {
      subject_id: Number(subjectId),
      incorrect_meaning_answers: incorrectMeaningAnswers,
      incorrect_reading_answers: incorrectReadingAnswers,
    });
  }

  return wanikaniClient.createReview({
    assignment_id: Number(assignmentId),
    incorrect_meaning_answers: incorrectMeaningAnswers,
    incorrect_reading_answers: incorrectReadingAnswers
  });
}

export async function startReviewSession(userId: string, limit: number = 20, contentType: string = 'all') {
  // Use v2 assignments for fetching due items
  const assignments = await wanikaniApiService.listAssignments(userId, {
    immediately_available_for_review: true,
  });
  return assignments.data.slice(0, limit);
}

export async function startLessonSession(userId: string, level?: number, deckId?: string) {
  if (deckId) {
    return buildCustomDeckLessonAssignments(deckId);
  }

  const assignments = await wanikaniApiService.listAssignments(userId, {
    immediately_available_for_lessons: true,
    levels: level ? [level] : undefined,
  });
  return assignments.data;
}

export async function completeLessonSession(assignmentId: number | string) {
  // In v2, starting an assignment marks it as started.
  return wanikaniClient.startAssignment(assignmentId);
}

import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';

export async function fetchUserDashboardStats(userId: string, deckId?: string) {
  const numericDeckId = parseDeckId(deckId);
  if (numericDeckId) {
    const dueAssignments = await buildCustomDeckReviewAssignments(deckId!);
    const dueNow = dueAssignments.filter((item) => item.data.available_at && new Date(item.data.available_at) <= new Date());
    return {
      reviewsDue: dueNow.length,
      lessonsAvailable: 0,
      nextReviewAt: dueNow[0]?.data.available_at ?? null,
      retention: 0,
      streak: 0,
      reviewsToday: 0,
      totalBurned: 0,
      totalLearned: 0,
      dueBreakdown: {
        learning: dueNow.filter((item) => item.data.srs_stage <= 4).length,
        review: dueNow.filter((item) => item.data.srs_stage > 4).length,
      },
      forecast: {
        hourly: [],
        daily: [],
      },
    };
  }

  const summary = await wanikaniApiService.getSummary(userId);
  
  // Map v2 summary to legacy DashboardStats structure for UI compatibility
  const now = new Date();
  const reviewsDue = summary.data.reviews
    .filter((r: any) => new Date(r.available_at) <= now)
    .reduce((acc: number, r: any) => acc + r.subject_ids.length, 0);
  
  const lessonsAvailable = summary.data.lessons
    .filter((l: any) => new Date(l.available_at) <= now)
    .reduce((acc: number, l: any) => acc + l.subject_ids.length, 0);

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
    dueBreakdown: {
      learning: 0,
      review: reviewsDue,
    },
    forecast: {
      hourly: summary.data.reviews.map((r: any) => ({
        time: r.available_at,
        count: r.subject_ids.length
      })),
      daily: []
    }
  };
}
