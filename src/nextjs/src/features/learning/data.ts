import { addHours } from 'date-fns';

import { curriculumRepository } from '../knowledge/db';
import { getUserProfile, updateUserProfile } from '../auth/db';
import { HanaTime } from '@/lib/time';
import { lessonRepository } from './lessonRepository';
import { srsRepository } from './srsRepository';

export async function initializeSRS(userId: string, unitId: string, facets: string[]) {
  const initialStability = 0.166;
  const initialDifficulty = 3;
  const nextReview = addHours(HanaTime.getNow(), 4);

  console.log(`[LearningData] Initializing SRS for ${unitId} with facets: ${facets.join(', ')}`);

  for (const facet of facets) {
    await srsRepository.updateUserState(userId, unitId, facet, {
      state: 'learning',
      next_review: nextReview.toISOString(),
      reps: 1,
      lapses: 0,
      last_review: HanaTime.getNowISO(),
      stability: initialStability,
      difficulty: initialDifficulty,
    });
  }
}

export async function fetchDueItems(userId: string, deckId?: string) {
  return srsRepository.fetchDueItems(userId, deckId);
}

export async function fetchNewItems(userId: string, identifier: string, limit: number = 5) {
  let level: number | undefined;
  let deckId: string | undefined;

  if (identifier?.startsWith('level-')) {
    level = Number.parseInt(identifier.split('-')[1], 10);
  } else if (identifier && identifier.length > 30) {
    deckId = identifier;
  }

  return lessonRepository.fetchNewItems(userId, limit, level, deckId);
}

export async function fetchCurriculumStats() {
  return lessonRepository.fetchCurriculumStats();
}

export async function checkAndUnlockNextLevel(userId: string, currentLevel: number) {
  const stats = await fetchCurriculumStats();
  const totalInLevel = stats[currentLevel] || 0;
  if (totalInLevel === 0) {
    return;
  }

  const levelItems = await lessonRepository.fetchLevelContent(currentLevel, userId);
  const mastered = levelItems.filter((item) => {
    const states = item.user_fsrs_states;
    if (!states || states.length === 0) {
      return false;
    }

    return states.every((state: any) => state.state === 'review' || state.state === 'burned');
  }).length;

  const percentage = mastered / totalInLevel;
  if (percentage < 0.9) {
    return;
  }

  console.log(
    `[LearningData] Level ${currentLevel} mastered (${Math.round(percentage * 100)}%). Unlocking Level ${currentLevel + 1}`,
  );

  const profile = await getUserProfile(userId);
  if (profile?.level === currentLevel) {
    await updateUserProfile(userId, { level: currentLevel + 1 });
  }
}

export async function fetchLevelStats(userId: string, levelId: string) {
  let level: number | null = null;
  if (levelId.startsWith('level-')) {
    level = Number.parseInt(levelId.split('-')[1], 10);
  }

  if (!level) {
    return { total: 0, learned: 0, mastered: 0, due: 0, new: 0 };
  }

  void checkAndUnlockNextLevel(userId, level);

  const counts = await fetchCurriculumStats();
  const total = counts[level] || 0;
  const levelItems = await lessonRepository.fetchLevelContent(level, userId);
  const learned = levelItems.filter((item) => item.user_fsrs_states?.length > 0).length;
  const mastered = levelItems.filter((item) => {
    const states = item.user_fsrs_states;
    if (!states || states.length === 0) {
      return false;
    }

    return states.every((state: any) => state.state === 'review' || state.state === 'burned');
  }).length;

  const typeStats = {
    radical: { total: 0, mastered: 0 },
    kanji: { total: 0, mastered: 0 },
    vocabulary: { total: 0, mastered: 0 },
    grammar: { total: 0, mastered: 0 },
  };

  levelItems.forEach((item) => {
    let type = item.type;
    if (type === 'vocab') {
      type = 'vocabulary';
    }

    const typeKey = type as keyof typeof typeStats;
    if (!typeStats[typeKey]) {
      return;
    }

    typeStats[typeKey].total++;
    const states = item.user_fsrs_states;
    if (states?.length > 0 && states.every((state: any) => state.state === 'review' || state.state === 'burned')) {
      typeStats[typeKey].mastered++;
    }
  });

  return {
    total,
    learned,
    mastered,
    typeStats,
    due: levelItems.filter((item) => {
      const state = item.user_fsrs_states?.[0];
      return state && new Date(state.next_review) <= HanaTime.getNow();
    }).length,
    new: total - learned,
  };
}

export async function fetchItemDetails(type: string, slug: string) {
  return curriculumRepository.getBySlug(slug, type as any);
}