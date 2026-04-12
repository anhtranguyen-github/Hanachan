import { createClient } from '@/utils/supabase/server';
import { fsrsService } from '@/features/learning/services/fsrsService';
import { 
  SubjectResource, 
  SubjectCollection, 
  AssignmentResource, 
  AssignmentCollection,
  BaseCollection,
  SubjectType,
  ReviewCreateRequest,
  ReviewCreateResponse,
  CustomDeckCollection,
  CustomDeckResource,
  CustomDeckCreateRequest
} from '@/types/wanikani';

/**
 * Service to handle WaniKani v2 API business logic and Supabase data mapping.
 */
export class WanikaniApiService {
  
  /**
   * List subjects from knowledge_units joined with their specific details.
   */
  async listSubjects(params: {
    ids?: number[];
    types?: string[];
    levels?: number[];
    slugs?: string[];
    page_after_id?: number;
  } = {}): Promise<SubjectCollection> {
    const supabase = createClient();
    
    let query = supabase
      .from('knowledge_units')
      .select(`
        *,
        radical_details(*),
        kanji_details(*),
        vocabulary_details(*),
        grammar_details(*)
      `);

    if (params.ids && params.ids.length > 0) query = query.in('id', params.ids);
    if (params.types && params.types.length > 0) query = query.in('type', params.types);
    if (params.levels && params.levels.length > 0) query = query.in('level', params.levels);
    if (params.slugs && params.slugs.length > 0) query = query.in('slug', params.slugs);
    if (params.page_after_id) query = query.gt('id', params.page_after_id);

    // Limit to 500 as per WaniKani spec
    const { data, error, count } = await query.limit(500).order('id');

    if (error) throw error;

    const subjects: SubjectResource[] = (data || []).map(ku => this.mapKuToSubject(ku));

    return {
      object: 'collection',
      url: '/api/v2/subjects',
      pages: {
        per_page: 500,
        next_url: null,
        previous_url: null
      },
      total_count: count || subjects.length,
      data_updated_at: new Date().toISOString(),
      data: subjects
    };
  }

  /**
   * Map a Supabase knowledge_unit row to a WaniKani SubjectResource.
   */
  private mapKuToSubject(ku: any): SubjectResource {
    const type = ku.type as SubjectType;
    
    const data: any = {
      created_at: ku.created_at,
      level: ku.level,
      slug: ku.slug,
      characters: ku.character,
      meanings: [{
        meaning: ku.meaning,
        primary: true,
        accepted_answer: true
      }],
      auxiliary_meanings: [],
      meaning_mnemonic: ku.meaning_mnemonic || '',
      spaced_repetition_system_id: 1,
      document_url: ku.document_url,
      readings: [],
      reading_mnemonic: '',
      lesson_position: 0,
      component_subject_ids: [],
      amalgamation_subject_ids: [],
      visually_similar_subject_ids: [],
      meaning_hint: null,
      reading_hint: null,
      parts_of_speech: [],
      context_sentences: [],
      pronunciation_audios: []
    };

    // Merge type-specific details from joined tables
    if (type === 'radical' && ku.radical_details) {
      data.meaning_mnemonic = ku.radical_details.meaning_mnemonic;
    } else if (type === 'kanji' && ku.kanji_details) {
      data.meaning_mnemonic = ku.kanji_details.meaning_mnemonic;
      data.reading_mnemonic = ku.kanji_details.reading_mnemonic;
      data.readings = [
        ...(ku.kanji_details.onyomi || []).map((r: string) => ({ reading: r, type: 'onyomi', primary: true, accepted_answer: true })),
        ...(ku.kanji_details.kunyomi || []).map((r: string) => ({ reading: r, type: 'kunyomi', primary: false, accepted_answer: true }))
      ];
    } else if (type === 'vocabulary' && ku.vocabulary_details) {
      data.meaning_mnemonic = ku.vocabulary_details.meaning_mnemonic;
      data.readings = ku.vocabulary_details.reading ? [{
        reading: ku.vocabulary_details.reading,
        primary: true,
        accepted_answer: true
      }] : [];
      data.parts_of_speech = ku.vocabulary_details.parts_of_speech || [];
      data.context_sentences = ku.vocabulary_details.context_sentences || [];
    }

    return {
      id: ku.id,
      object: type,
      url: `/api/v2/subjects/${ku.id}`,
      data_updated_at: ku.updated_at,
      data
    } as SubjectResource;
  }

  /**
   * List all custom decks for the user.
   */
  async listCustomDecks(userId: string): Promise<CustomDeckCollection> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('custom_decks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const decks: CustomDeckResource[] = (data || []).map(deck => ({
      id: deck.id,
      object: 'custom_deck',
      url: `/api/v2/custom_decks/${deck.id}`,
      data_updated_at: deck.updated_at,
      data: {
        name: deck.name,
        description: deck.description,
        current_level: deck.current_level,
        config: deck.config,
        created_at: deck.created_at
      }
    }));

    return {
      object: 'collection',
      url: '/api/v2/custom_decks',
      pages: { per_page: 500, next_url: null, previous_url: null },
      total_count: decks.length,
      data_updated_at: new Date().toISOString(),
      data: decks
    } as CustomDeckCollection;
  }

  /**
   * Create a new custom deck.
   */
  async createCustomDeck(userId: string, body: CustomDeckCreateRequest): Promise<CustomDeckResource> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('custom_decks')
      .insert({
        user_id: userId,
        name: body.name,
        description: body.description,
        config: body.config || {}
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      object: 'custom_deck',
      url: `/api/v2/custom_decks/${data.id}`,
      data_updated_at: data.updated_at,
      data: {
        name: data.name,
        description: data.description,
        current_level: data.current_level,
        config: data.config,
        created_at: data.created_at
      }
    } as CustomDeckResource;
  }

  /**
   * List items in a custom deck.
   */
  async listDeckItems(userId: string, deckId: string): Promise<BaseCollection<any>> {
    const supabase = createClient();
    
    // Check ownership first
    const { data: deck, error: deckError } = await supabase
      .from('custom_decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    if (deckError || !deck) throw new Error('Deck not found or access denied');

    const { data, error } = await supabase
      .from('custom_deck_items')
      .select(`
        *,
        knowledge_units(*)
      `)
      .eq('deck_id', deckId);

    if (error) throw error;

    const items = (data || []).map(row => ({
      id: row.id,
      object: 'custom_deck_item',
      url: `/api/v2/custom_decks/${deckId}/items/${row.id}`,
      data_updated_at: row.created_at,
      data: {
        deck_id: row.deck_id,
        subject_id: row.subject_id,
        custom_level: row.custom_level,
        created_at: row.created_at,
        subject: row.knowledge_units ? this.mapKuToSubject(row.knowledge_units) : null
      }
    }));

    return {
      object: 'collection',
      url: `/api/v2/custom_decks/${deckId}/items`,
      pages: { per_page: 500, next_url: null, previous_url: null },
      total_count: items.length,
      data_updated_at: new Date().toISOString(),
      data: items
    };
  }

  /**
   * Add an item to a custom deck.
   */
  async addDeckItem(userId: string, deckId: string, subjectId: string, customLevel: number = 1): Promise<any> {
    const supabase = createClient();
    
    // Check ownership
    const { data: deck, error: deckError } = await supabase
      .from('custom_decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    if (deckError || !deck) throw new Error('Deck not found or access denied');

    const { data, error } = await supabase
      .from('custom_deck_items')
      .insert({
        deck_id: deckId,
        subject_id: subjectId,
        custom_level: customLevel
      })
      .select()
      .single();

    if (error) throw error;

    // Also initialize progress for this item
    await supabase.from('custom_deck_progress').insert({
      deck_id: deckId,
      subject_id: subjectId,
      custom_stage: 0
    });

    return {
      id: data.id,
      object: 'custom_deck_item',
      url: `/api/v2/custom_decks/${deckId}/items/${data.id}`,
      data_updated_at: data.created_at,
      data: {
        deck_id: data.deck_id,
        subject_id: data.subject_id,
        custom_level: data.custom_level,
        created_at: data.created_at
      }
    };
  }

  /**
   * Remove an item from a custom deck.
   */
  async removeDeckItem(userId: string, deckId: string, itemId: string): Promise<void> {
    const supabase = createClient();
    
    // Check ownership
    const { data: deck, error: deckError } = await supabase
      .from('custom_decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    if (deckError || !deck) throw new Error('Deck not found or access denied');

    const { error } = await supabase
      .from('custom_deck_items')
      .delete()
      .eq('id', itemId)
      .eq('deck_id', deckId);

    if (error) throw error;
  }

  /**
   * List assignments for the current authenticated user.
   */
  async listAssignments(userId: string, params: {
    immediately_available_for_lessons?: boolean;
    immediately_available_for_review?: boolean;
    subject_ids?: number[];
    levels?: number[];
  } = {}): Promise<AssignmentCollection> {
    const supabase = createClient();
    
    // In our schema, assignments map to user_learning_states
    let query = supabase
      .from('user_learning_states')
      .select(`
        *,
        knowledge_units!inner(*)
      `)
      .eq('user_id', userId)
      .neq('knowledge_units.type', 'grammar');

    if (params.subject_ids && params.subject_ids.length > 0) {
      query = query.in('ku_id', params.subject_ids);
    }
    
    if (params.levels && params.levels.length > 0) {
      query = query.in('knowledge_units.level', params.levels);
    }

    if (params.immediately_available_for_review) {
      query = query.lte('next_review', new Date().toISOString());
    }

    // Lessons logic: WaniKani assignments are "available for lessons" if srs_stage is 0
    // and they are unlocked (usually by leveling up).
    if (params.immediately_available_for_lessons) {
      query = query.eq('state', 'new');
    }

    const { data, error } = await query;

    if (error) throw error;

    const assignments: AssignmentResource[] = (data || []).map(row => ({
      id: row.id,
      object: 'assignment',
      url: `/api/v2/assignments/${row.id}`,
      data_updated_at: row.updated_at,
      data: {
        available_at: row.next_review,
        burned_at: row.state === 'burned' ? row.updated_at : null,
        created_at: row.created_at,
        hidden: false,
        passed_at: row.reps > 0 ? row.created_at : null, // Simplification
        resurrected_at: null,
        srs_stage: row.reps || 0,
        started_at: row.last_review,
        subject_id: row.ku_id,
        subject_type: row.knowledge_units.type as SubjectType,
        unlocked_at: row.created_at
      }
    }));

    return {
      object: 'collection',
      url: '/api/v2/assignments',
      pages: { per_page: 500, next_url: null, previous_url: null },
      total_count: assignments.length,
      data_updated_at: new Date().toISOString(),
      data: assignments
    };
  }

  /**
   * Submit a review for an assignment.
   */
  async submitReview(userId: string, body: ReviewCreateRequest): Promise<ReviewCreateResponse> {
    const supabase = createClient();

    // 1. Get the assignment/learning state record
    const { data: assignment, error: assignError } = await supabase
      .from('user_learning_states')
      .select('*')
      .eq('id', body.assignment_id)
      .eq('user_id', userId)
      .single();

    if (assignError || !assignment) {
      throw new Error(`Assignment ${body.assignment_id} not found`);
    }

    // 2. Map WaniKani rating logic 
    const isCorrect = body.incorrect_meaning_answers === 0 && body.incorrect_reading_answers === 0;
    const rating = isCorrect ? 3 : 1; // 3=Good, 1=Again

    // 3. Use specialized FSRS Service for calculation and update
    const result = await fsrsService.submitReview(
      userId,
      assignment.ku_id,
      'ku',
      rating as any,
      assignment.facet
    );

    // 4. Fetch updated assignment for resources_updated
    const updatedAssignments = await this.listAssignments(userId, { subject_ids: [assignment.ku_id as any] });
    const updatedAssignment = updatedAssignments.data[0];

    return {
      id: assignment.id,
      object: 'review',
      url: `/api/v2/reviews/${assignment.id}`,
      data_updated_at: new Date().toISOString(),
      data: {
        assignment_id: assignment.id,
        subject_id: assignment.ku_id,
        incorrect_meaning_answers: body.incorrect_meaning_answers,
        incorrect_reading_answers: body.incorrect_reading_answers,
        created_at: new Date().toISOString(),
        starting_srs_stage: assignment.state === 'review' ? 4 : 1,
        ending_srs_stage: result.state === 'review' ? 4 : 1,
        spaced_repetition_system_id: 1
      },
      resources_updated: {
        assignment: updatedAssignment
      }
    };
  }

  /**
   * Get a summary of the user's current status (available lessons and reviews).
   */
  async getSummary(userId: string): Promise<any> {
    const assignments = await this.listAssignments(userId);
    const now = new Date();

    const lessons = assignments.data.filter(a => !a.data.started_at);
    const reviews = assignments.data.filter(a => a.data.available_at && new Date(a.data.available_at) <= now);

    return {
      object: 'report',
      url: '/api/v2/summary',
      data_updated_at: new Date().toISOString(),
      data: {
        lessons: [
          {
            available_at: now.toISOString(),
            subject_ids: lessons.map(l => l.data.subject_id)
          }
        ],
        next_reviews_at: assignments.data
          .filter(a => a.data.available_at && new Date(a.data.available_at) > now)
          .sort((a, b) => new Date(a.data.available_at!).getTime() - new Date(b.data.available_at!).getTime())[0]?.data.available_at || null,
        reviews: [
          {
            available_at: now.toISOString(),
            subject_ids: reviews.map(r => r.data.subject_id)
          }
        ]
      }
    };
  }

  /**
   * Get global user statistics for the dashboard.
   */
  async getGlobalStats(userId: string) {
    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [burnedRes, learnedRes, reviewsTodayRes] = await Promise.all([
      supabase.from('user_learning_states').select('id, knowledge_units!inner(type)', { count: 'exact', head: true }).eq('user_id', userId).eq('state', 'burned').neq('knowledge_units.type', 'grammar'),
      supabase.from('user_learning_states').select('id, knowledge_units!inner(type)', { count: 'exact', head: true }).eq('user_id', userId).neq('state', 'new').neq('knowledge_units.type', 'grammar'),
      supabase.from('fsrs_review_logs').select('id, knowledge_units!inner(type)', { count: 'exact', head: true }).eq('user_id', userId).gte('reviewed_at', todayISO).neq('knowledge_units.type', 'grammar')
    ]);

    return {
      totalBurned: burnedRes.count || 0,
      totalLearned: learnedRes.count || 0,
      reviewsToday: reviewsTodayRes.count || 0,
      retention: 0,
      streak: 0,
    };
  }

  async getSrsSpread(userId: string) {
    const supabase = createClient();
    
    // In our simplified mapping, reps 1-4 are Apprentice, 5-6 Guru, 7 Master, 8 Enlightened, 9+ Burned
    const { data, error } = await supabase
      .from('user_learning_states')
      .select(`
        reps,
        state,
        knowledge_units!inner(type)
      `)
      .eq('user_id', userId)
      .neq('knowledge_units.type', 'grammar');

    if (error) throw error;

    const spread = {
      apprentice: 0,
      guru: 0,
      master: 0,
      enlightened: 0,
      burned: 0,
    };

    // For the detailed breakdown the user wants
    const detailed = {
      apprentice1: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      apprentice2: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      apprentice3: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      apprentice4: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      guru1: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      guru2: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      master: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      enlightened: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
      burned: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
    };

    data.forEach(row => {
      // Cast explicitly to handle potential Supabase join ambiguity
      const ku = (Array.isArray(row.knowledge_units) ? row.knowledge_units[0] : row.knowledge_units) as any;
      const type = ku?.type as 'radical' | 'kanji' | 'vocabulary';
      if (!type) return;
      
      const reps = row.reps || 0;
      
      if (reps >= 1 && reps <= 4) spread.apprentice++;
      else if (reps >= 5 && reps <= 6) spread.guru++;
      else if (reps === 7) spread.master++;
      else if (reps === 8) spread.enlightened++;
      else if (reps >= 9 || row.state === 'burned') spread.burned++;

      // Detailed mapping
      let target: any = null;
      if (reps === 1) target = detailed.apprentice1;
      else if (reps === 2) target = detailed.apprentice2;
      else if (reps === 3) target = detailed.apprentice3;
      else if (reps === 4) target = detailed.apprentice4;
      else if (reps === 5) target = detailed.guru1;
      else if (reps === 6) target = detailed.guru2;
      else if (reps === 7) target = detailed.master;
      else if (reps === 8) target = detailed.enlightened;
      else if (reps >= 9 || row.state === 'burned') target = detailed.burned;

      if (target && target[type] !== undefined) {
        target[type]++;
        target.total++;
      }
    });

    return { spread, detailed };
  }

  /**
   * Get review forecast for the next 7 days.
   */
  async getReviewForecast(userId: string) {
    const supabase = createClient();
    const now = new Date();
    const weekLater = new Date(now);
    weekLater.setDate(now.getDate() + 7);

    const { data, error } = await supabase
      .from('user_learning_states')
      .select('next_review')
      .eq('user_id', userId)
      .is('burned_at', null)
      .not('next_review', 'is', null)
      .gte('next_review', now.toISOString())
      .lte('next_review', weekLater.toISOString());

    if (error) throw error;

    const forecast: Record<string, number> = {};
    (data || []).forEach(row => {
      const date = new Date(row.next_review);
      date.setMinutes(0, 0, 0); // Round down to the hour
      const key = date.toISOString();
      forecast[key] = (forecast[key] || 0) + 1;
    });

    return forecast;
  }

  /**
   * Get critical condition items (accuracy < 75%).
   */
  async getCriticalItems(userId: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('wanikani_review_statistics')
      .select(`
        subject_id,
        percentage_correct,
        meaning_correct,
        meaning_incorrect,
        reading_correct,
        reading_incorrect,
        knowledge_units!inner(character, meaning, type, level)
      `)
      .eq('user_id', userId)
      .lt('percentage_correct', 75)
      .order('percentage_correct', { ascending: true })
      .limit(10);

    if (error) throw error;

    return (data || []).map(row => ({
      ...row,
      knowledge_unit: Array.isArray(row.knowledge_units) ? row.knowledge_units[0] : row.knowledge_units
    }));
  }

  /**
   * Get JLPT and Joyo progress.
   */
  async getJlptJoyoProgress(userId: string) {
    const supabase = createClient();
    
    // We want to count items that are "Passed" (Guru or higher) or "Burned"
    // reps >= 5 is Guru
    const { data, error } = await supabase
      .from('user_learning_states')
      .select(`
        reps,
        state,
        knowledge_units!inner(type, level, jlpt_level, joyo_grade)
      `)
      .eq('user_id', userId)
      .eq('knowledge_units.type', 'kanji');

    if (error) throw error;

    const jlpt: Record<number, { total: number, passed: number, burned: number }> = {
      1: { total: 0, passed: 0, burned: 0 },
      2: { total: 0, passed: 0, burned: 0 },
      3: { total: 0, passed: 0, burned: 0 },
      4: { total: 0, passed: 0, burned: 0 },
      5: { total: 0, passed: 0, burned: 0 },
    };

    const joyo: Record<number, { total: number, passed: number, burned: number }> = {
      1: { total: 0, passed: 0, burned: 0 },
      2: { total: 0, passed: 0, burned: 0 },
      3: { total: 0, passed: 0, burned: 0 },
      4: { total: 0, passed: 0, burned: 0 },
      5: { total: 0, passed: 0, burned: 0 },
      6: { total: 0, passed: 0, burned: 0 },
      8: { total: 0, passed: 0, burned: 0 },
    };

    data.forEach(row => {
      const ku = (Array.isArray(row.knowledge_units) ? row.knowledge_units[0] : row.knowledge_units) as any;
      const jl = ku?.jlpt_level;
      const jg = ku?.joyo_grade;

      const isPassed = (row.reps || 0) >= 5;
      const isBurned = row.state === 'burned' || (row.reps || 0) >= 9;

      if (jl && jlpt[jl]) {
        jlpt[jl].total++;
        if (isPassed) jlpt[jl].passed++;
        if (isBurned) jlpt[jl].burned++;
      }

      if (jg && joyo[jg]) {
        joyo[jg].total++;
        if (isPassed) joyo[jg].passed++;
        if (isBurned) joyo[jg].burned++;
      }
    });

    return { jlpt, joyo };
  }

  /**
   * Get recently unlocked and burned items.
   */
  async getRecentActivity(userId: string) {
    const supabase = createClient();
    const ago30d = new Date();
    ago30d.setDate(ago30d.getDate() - 30);

    const { data: unlocked, error: e1 } = await supabase
      .from('user_learning_states')
      .select('unlocked_at, knowledge_units!inner(character, meaning, type, level)')
      .eq('user_id', userId)
      .not('unlocked_at', 'is', null)
      .gte('unlocked_at', ago30d.toISOString())
      .order('unlocked_at', { ascending: false })
      .limit(20);

    const { data: burned, error: e2 } = await supabase
      .from('user_learning_states')
      .select('burned_at, knowledge_units!inner(character, meaning, type, level)')
      .eq('user_id', userId)
      .not('burned_at', 'is', null)
      .gte('burned_at', ago30d.toISOString())
      .order('burned_at', { ascending: false })
      .limit(20);

    if (e1) throw e1;
    if (e2) throw e2;

    return { 
      unlocked: (unlocked || []).map(row => ({ ...row, knowledge_unit: (Array.isArray(row.knowledge_units) ? row.knowledge_units[0] : row.knowledge_units) as any })),
      burned: (burned || []).map(row => ({ ...row, knowledge_unit: (Array.isArray(row.knowledge_units) ? row.knowledge_units[0] : row.knowledge_units) as any }))
    };
  }
}

export const wanikaniApiService = new WanikaniApiService();
