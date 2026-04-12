import { createClient } from '@/utils/supabase/server';
import { AssignmentCollection, AssignmentResource, ReviewStatisticCollection, ReviewStatisticResource } from '@/types/wanikani';
import { HanaTime } from '@/lib/time';

/**
 * Service to synchronize WaniKani API data with the local Global_Progress database.
 */
export class WanikaniSyncService {
  private baseUrl = 'https://api.wanikani.com/v2';

  /**
   * Fetch all assignments from WaniKani API with pagination support.
   */
  async fetchAssignments(apiToken: string): Promise<AssignmentResource[]> {
    let allAssignments: AssignmentResource[] = [];
    let nextUrl: string | null = `${this.baseUrl}/assignments`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Wanikani-Revision': '20170710',
        },
      });

      if (!response.ok) {
        throw new Error(`WaniKani API error: ${response.statusText}`);
      }

      const collection: AssignmentCollection = await response.json();
      allAssignments = allAssignments.concat(collection.data);
      nextUrl = collection.pages.next_url;
    }

    return allAssignments;
  }

  /**
   * Fetch all review statistics from WaniKani API with pagination support.
   */
  async fetchReviewStatistics(apiToken: string): Promise<ReviewStatisticResource[]> {
    let allStats: ReviewStatisticResource[] = [];
    let nextUrl: string | null = `${this.baseUrl}/review_statistics`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Wanikani-Revision': '20170710',
        },
      });

      if (!response.ok) {
        throw new Error(`WaniKani API error: ${response.statusText}`);
      }

      const collection: any = await response.json();
      allStats = allStats.concat(collection.data);
      nextUrl = collection.pages.next_url;
    }

    return allStats;
  }

  /**
   * Map WaniKani SRS stage to FSRS parameters.
   */
  calculateFsrsFromSrsStage(srsStage: number) {
    // Basic mapping based on interval expectations
    // 0: Initial, 1-4: Apprentice, 5-6: Guru, 7: Master, 8: Enlightened, 9: Burned
    const mapping: Record<number, { stability: number; state: string; difficulty: number; reps: number; wk_state: string }> = {
      0: { stability: 0, state: 'new', difficulty: 5.0, reps: 0, wk_state: 'locked' },
      1: { stability: 0.16, state: 'learning', difficulty: 5.0, reps: 1, wk_state: 'in_lessons' }, 
      2: { stability: 0.33, state: 'learning', difficulty: 5.0, reps: 2, wk_state: 'review' },
      3: { stability: 1.0, state: 'learning', difficulty: 5.0, reps: 3, wk_state: 'review' },
      4: { stability: 2.0, state: 'learning', difficulty: 5.0, reps: 4, wk_state: 'review' },
      5: { stability: 7.0, state: 'review', difficulty: 5.0, reps: 5, wk_state: 'review' },
      6: { stability: 14.0, state: 'review', difficulty: 5.0, reps: 6, wk_state: 'review' },
      7: { stability: 30.0, state: 'review', difficulty: 4.5, reps: 7, wk_state: 'review' },
      8: { stability: 120.0, state: 'review', difficulty: 4.0, reps: 8, wk_state: 'review' },
      9: { stability: 3650.0, state: 'burned', difficulty: 3.0, reps: 9, wk_state: 'burned' },
    };

    return mapping[srsStage] || mapping[0];
  }

  /**
   * Preview the sync results: returns comparison stats.
   */
  async preview(userId: string, apiToken: string) {
    const assignments = await this.fetchAssignments(apiToken);
    const supabase = createClient();

    // Map WK IDs to Knowledge Unit IDs
    const { data: kuData } = await supabase
      .from('knowledge_units')
      .select('id, metadata')
      .like('slug', 'wk-%');

    const wkToKuMap = new Map<number | string, string>();
    kuData?.forEach((ku) => {
      const wkId = (ku.metadata as any)?.wk_id;
      if (wkId !== undefined && wkId !== null) wkToKuMap.set(Number(wkId), ku.id);
    });

    const kuIds = assignments
      .map((a) => wkToKuMap.get(a.data.subject_id))
      .filter((id) => !!id) as string[];

    // Fetch existing local states
    const { data: localStates } = await supabase
      .from('user_learning_states')
      .select('ku_id, stability')
      .eq('user_id', userId)
      .eq('facet', 'meaning')
      .in('ku_id', kuIds);

    const localMap = new Map<string, number>();
    localStates?.forEach((s) => localMap.set(s.ku_id, s.stability));

    let aheadCount = 0;
    let behindCount = 0; // WaniKani is further ahead than local
    let sameCount = 0;
    let newItemsCount = 0;

    for (const assignment of assignments) {
      const kuId = wkToKuMap.get(assignment.data.subject_id);
      if (!kuId) continue;

      const wkStability = this.calculateFsrsFromSrsStage(assignment.data.srs_stage).stability;
      const localStability = localMap.get(kuId);

      if (localStability === undefined) {
        newItemsCount++;
      } else if (wkStability > localStability) {
        behindCount++;
      } else if (localStability > wkStability) {
        aheadCount++;
      } else {
        sameCount++;
      }
    }

    return {
      total: assignments.length,
      ahead: aheadCount,
      behind: behindCount,
      same: sameCount,
      new: newItemsCount,
    };
  }

  /**
   * Synchronize assignments into user_learning_states.
   */
  async sync(userId: string, apiToken: string, strategy: 'merge' | 'overwrite') {
    const assignments = await this.fetchAssignments(apiToken);
    const supabase = createClient();

    const { data: kuData } = await supabase
        .from('knowledge_units')
        .select('id, metadata')
        .like('slug', 'wk-%');
    
    const wkToKuMap = new Map<number | string, string>();
    kuData?.forEach(ku => {
        const wkId = (ku.metadata as any)?.wk_id;
        if (wkId !== undefined && wkId !== null) wkToKuMap.set(Number(wkId), ku.id);
    });

    const now = HanaTime.getNowISO();
    const batchSize = 100;
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        
        // Fetch existing states for this batch to compare
        const kuIdsInBatch = batch.map(a => wkToKuMap.get(a.data.subject_id)).filter(id => !!id) as string[];
        const { data: existingStates } = await supabase
            .from('user_learning_states')
            .select('ku_id, stability, next_review')
            .eq('user_id', userId)
            .in('ku_id', kuIdsInBatch)
            .eq('facet', 'meaning');

        const stateMap = new Map<string, any>();
        existingStates?.forEach(s => stateMap.set(s.ku_id, s));

        const upsertData: any[] = [];

        for (const assignment of batch) {
            const kuId = wkToKuMap.get(assignment.data.subject_id);
            if (!kuId) continue;

            const fsrs = this.calculateFsrsFromSrsStage(assignment.data.srs_stage);
            const localState = stateMap.get(kuId);

            // Refine wk_state based on timestamps if needed
            let effectiveWkState = fsrs.wk_state;
            if (effectiveWkState === 'in_lessons' && !assignment.data.unlocked_at) {
                effectiveWkState = 'locked';
            } else if (effectiveWkState === 'review' && !assignment.data.started_at) {
                effectiveWkState = 'in_lessons';
            }

            if (localState) {
                // "Prefer which ahead" - logic refinement
                // For 'merge', we update if WK is greater OR EQUAL in stability.
                // This ensures we always sync WaniKani's latest timestamps (next_review, etc) if they are on the same SRS stage.
                const isWkAheadOrSame = fsrs.stability >= localState.stability;
                
                // If local is strictly ahead in stability, keep local completely, unless strategy is overwrite.
                if (!isWkAheadOrSame && strategy !== 'overwrite') {
                    skippedCount++;
                    continue;
                }
            }

            updatedCount++;
            upsertData.push({
                user_id: userId,
                ku_id: kuId,
                facet: 'meaning',
                state: fsrs.state,
                stability: fsrs.stability,
                difficulty: fsrs.difficulty,
                reps: fsrs.reps,
                lapses: 0,
                last_review: assignment.data.started_at || now,
                next_review: assignment.data.available_at || now,
                wanikani_state: effectiveWkState,
                unlocked_at: assignment.data.unlocked_at,
                started_at: assignment.data.started_at,
                burned_at: assignment.data.burned_at,
                updated_at: now
            });
        }

        if (upsertData.length > 0) {
            const { error } = await supabase
                .from('user_learning_states')
                .upsert(upsertData, { onConflict: 'user_id,ku_id,facet' });
            
            if (error) console.error('Error upserting batch:', error);
        }
    }

    // Now sync Review Statistics
    const stats = await this.fetchReviewStatistics(apiToken);
    const statsBatchSize = 100;
    let statsUpdatedCount = 0;

    for (let i = 0; i < stats.length; i += statsBatchSize) {
        const batch = stats.slice(i, i + statsBatchSize);
        const upsertData = batch.map(s => ({
            user_id: userId,
            subject_id: s.data.subject_id,
            subject_type: s.data.subject_type,
            percentage_correct: s.data.percentage_correct,
            meaning_correct: s.data.meaning_correct,
            meaning_incorrect: s.data.meaning_incorrect,
            meaning_max_streak: s.data.meaning_max_streak,
            meaning_current_streak: s.data.meaning_current_streak,
            reading_correct: s.data.reading_correct,
            reading_incorrect: s.data.reading_incorrect,
            reading_max_streak: s.data.reading_max_streak,
            reading_current_streak: s.data.reading_current_streak,
            updated_at: now
        }));

        const { error } = await supabase
            .from('wanikani_review_statistics')
            .upsert(upsertData, { onConflict: 'user_id,subject_id' });
        
        if (error) console.error('Error upserting stats batch:', error);
        else statsUpdatedCount += batch.length;
    }

    return { total: assignments.length, updated: updatedCount, skipped: skippedCount, statsUpdated: statsUpdatedCount };
  }
}

export const wanikaniSyncService = new WanikaniSyncService();
