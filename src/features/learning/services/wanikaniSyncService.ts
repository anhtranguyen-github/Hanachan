import { createClient } from '@/utils/supabase/server';
import { AssignmentCollection, AssignmentResource } from '@/types/wanikani';
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
   * Map WaniKani SRS stage to FSRS parameters.
   */
  calculateFsrsFromSrsStage(srsStage: number) {
    // Basic mapping based on interval expectations
    const mapping: Record<number, { stability: number; state: string; difficulty: number; reps: number }> = {
      0: { stability: 0, state: 'new', difficulty: 5.0, reps: 0 },
      1: { stability: 0.16, state: 'learning', difficulty: 5.0, reps: 1 }, // 4h
      2: { stability: 0.33, state: 'learning', difficulty: 5.0, reps: 2 }, // 8h
      3: { stability: 1.0, state: 'learning', difficulty: 5.0, reps: 3 }, // 1d
      4: { stability: 2.0, state: 'learning', difficulty: 5.0, reps: 4 }, // 2d
      5: { stability: 7.0, state: 'review', difficulty: 5.0, reps: 5 }, // 1w
      6: { stability: 14.0, state: 'review', difficulty: 5.0, reps: 6 }, // 2w
      7: { stability: 30.0, state: 'review', difficulty: 4.5, reps: 7 }, // 1m
      8: { stability: 120.0, state: 'review', difficulty: 4.0, reps: 8 }, // 4m
      9: { stability: 3650.0, state: 'burned', difficulty: 3.0, reps: 9 }, // Burned (10 years)
    };

    return mapping[srsStage] || mapping[0];
  }

  /**
   * Synchronize assignments into user_learning_states.
   */
  async sync(userId: string, apiToken: string, strategy: 'merge' | 'overwrite') {
    const assignments = await this.fetchAssignments(apiToken);
    const supabase = createClient();

    // Never remove data - based on user feedback "never removes them"
    // The previous delete-block is removed.

    const { data: kuData } = await supabase
        .from('knowledge_units')
        .select('id, metadata')
        .like('slug', 'wk-%');
    
    const wkToKuMap = new Map<number | string, string>();
    kuData?.forEach(ku => {
        const wkId = (ku.metadata as any)?.wk_id;
        if (wkId !== undefined && wkId !== null) wkToKuMap.set(wkId, ku.id);
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

            if (localState) {
                // "Prefer which ahead" - logic refinement
                const isWkAhead = fsrs.stability > localState.stability;
                const isWkSameButStrategyOverwrite = strategy === 'overwrite' && fsrs.stability >= localState.stability;
                
                // If local is strictly ahead in stability, keep local
                if (!isWkAhead && !isWkSameButStrategyOverwrite) {
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

    return { total: assignments.length, updated: updatedCount, skipped: skippedCount };
  }
}

export const wanikaniSyncService = new WanikaniSyncService();
