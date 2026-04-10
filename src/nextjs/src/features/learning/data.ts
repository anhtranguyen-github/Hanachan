import { wanikaniClient } from '@/services/wanikaniClient';

export async function initializeSRS(userId: string, unitId: string, facets: string[]) {
  // Use v2 assignments implicitly or explicitly
  // Since we have v2 API, we can just let starting a lesson handle this
}

export async function fetchDueItems(userId: string, deckId?: string) {
  const result = await wanikaniClient.listAssignments({
    immediately_available_for_review: true,
  });
  return result.data;
}

export async function fetchNewItems(userId: string, identifier: string, limit: number = 5) {
  let level: number | undefined;
  if (identifier?.startsWith('level-')) {
    level = Number.parseInt(identifier.split('-')[1], 10);
  }
  
  const result = await wanikaniClient.listAssignments({
    immediately_available_for_lessons: true,
    levels: level ? [level] : undefined,
  });
  return result.data.slice(0, limit);
}

export async function fetchCurriculumStats() {
  // Fetch subject counts by level
  // Note: This could be optimized by a dedicated endpoint, but we can list levels
  // For now, return a placeholder or fetch subjects (expensive)
  return { 1: 50, 2: 50, 3: 50 };
}

export async function fetchLevelStats(userId: string, levelId: string) {
  let level: number | null = null;
  if (levelId.startsWith('level-')) {
    level = Number.parseInt(levelId.split('-')[1], 10);
  }

  if (!level) {
    return { total: 0, learned: 0, mastered: 0, due: 0, new: 0 };
  }

  // Fetch subjects in this level
  const subjectsRes = await wanikaniClient.listSubjects({ levels: [level] });
  const assignmentsRes = await wanikaniClient.listAssignments({ levels: [level] });

  const total = subjectsRes.total_count;
  const assignments = assignmentsRes.data;
  
  const learned = assignments.filter(a => a.data.started_at !== null).length;
  const mastered = assignments.filter(a => a.data.passed_at !== null).length;
  const burned = assignments.filter(a => a.data.burned_at !== null).length;
  const due = assignments.filter(a => a.data.available_at && new Date(a.data.available_at) <= new Date()).length;

  const typeStats = {
    radical: { total: 0, mastered: 0 },
    kanji: { total: 0, mastered: 0 },
    vocabulary: { total: 0, mastered: 0 },
    grammar: { total: 0, mastered: 0 },
  };

  subjectsRes.data.forEach((s) => {
    const type = s.data.document_url?.includes('grammar') ? 'grammar' : s.object;
    const typeKey = type as keyof typeof typeStats;
    if (typeStats[typeKey]) {
      typeStats[typeKey].total++;
      const assignment = assignments.find(a => a.data.subject_id === s.id);
      if (assignment?.data.passed_at) {
        typeStats[typeKey].mastered++;
      }
    }
  });

  return {
    total,
    learned,
    mastered,
    burned,
    due,
    new: total - learned,
    typeStats
  };
}

export async function fetchItemDetails(type: string, idOrSlug: string | number) {
  if (typeof idOrSlug === 'number') {
    return wanikaniClient.getSubject(idOrSlug as number);
  }
  
  // If slug, listSubjects by slug
  const res = await wanikaniClient.listSubjects({ slugs: [idOrSlug as string] });
  return res.data[0] || null;
}