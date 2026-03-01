// ==========================================
// VIDEO LEARNING FEATURE - SERVICE LAYER
// ==========================================

import { supabase, supabaseService } from '@/lib/supabase';
import * as db from './db';
import type {
  Video,
  VideoSubtitle,
  VideoVocabStat,
  VideoCategory,
  UserVideoLibraryEntry,
  VideoProgress,
  JLPTDistribution,
  WordLookupResult,
  SubtitleToken,
  GrammarPoint,
  AddToLibraryRequest,
  UpdateProgressRequest,
  CreateCategoryRequest,
  SaveWordRequest,
  LibraryFilters,
  DictationSettings,
  DictationSession,
  DictationAttemptResponse,
  DictationSessionStatus,
  DictationStats,
} from './types';

// ==========================================
// VIDEO MANAGEMENT
// ==========================================


/**
 * Fetch or create a video from YouTube ID.
 * Fetches metadata from YouTube if not cached.
 */
export async function getOrCreateVideo(youtubeId: string): Promise<Video> {
  // Check cache first
  const existing = await db.getVideoByYoutubeId(youtubeId);
  if (existing) return existing;

  // Create a minimal video entry (metadata will be enriched later)
  const video = await db.upsertVideo({
    youtube_id: youtubeId,
    title: `Video ${youtubeId}`,
    thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    language: 'ja',
  });

  // Try to process subtitles
  try {
    const backendUrl = process.env.MEMORY_API_URL || 'http://127.0.0.1:8765';
    console.log(`[VideoService] Fetching transcripts from ${backendUrl}/api/v1/videos/transcript/${youtubeId}`);
    const res = await fetch(`${backendUrl}/api/v1/videos/transcript/${youtubeId}`);
    if (res.ok) {
      const { transcript } = await res.json();

      const subtitleEntries = [];
      const wordFrequencies = new Map<string, any>();

      for (const segment of transcript) {
        // Tokens are already processed by FastAPI using Janome
        const tokens = segment.tokens || [];

        tokens.forEach((t: any) => {
          if (['助詞', '助動詞', '記号', '補助記号'].includes(t.pos)) return;
          const entry = wordFrequencies.get(t.surface) || { count: 0, reading: t.reading };
          entry.count++;
          wordFrequencies.set(t.surface, entry);
        });

        subtitleEntries.push({
          video_id: video.id,
          start_time_ms: Math.round(segment.start * 1000),
          end_time_ms: Math.round((segment.start + segment.duration) * 1000),
          text: segment.text,
          tokens: tokens
        });
      }

      // Save subtitles
      console.log(`[VideoService] Saving ${subtitleEntries.length} subtitles...`);
      const client = supabaseService || supabase;
      // db.ts doesn't expose raw insert, so we do it here via the service key exported in db.ts
      for (let i = 0; i < subtitleEntries.length; i += 100) {
        await client.from('video_subtitles').insert(subtitleEntries.slice(i, i + 100));
      }

      // Save vocab stats
      console.log(`[VideoService] Saving vocab stats...`);
      const vocabStats = Array.from(wordFrequencies.entries()).map(([surface, data]) => ({
        video_id: video.id,
        surface,
        reading: data.reading,
        frequency: data.count
      }));
      for (let i = 0; i < vocabStats.length; i += 100) {
        await client.from('video_vocab_stats').insert(vocabStats.slice(i, i + 100));
      }

      console.log(`[VideoService] Processing for ${youtubeId} complete.`);
    } else {
      console.error(`[VideoService] Failed to fetch transcripts: ${res.status}`);
    }
  } catch (err) {
    console.error(`[VideoService] Error processing video ${youtubeId}:`, err);
  }

  return video;
}

/**
 * Search videos with optional JLPT filter
 */
export async function searchVideos(query: string, jlptLevel?: number): Promise<Video[]> {
  return db.searchVideos(query, jlptLevel);
}

// ==========================================
// SUBTITLE PROCESSING
// ==========================================

/**
 * Get subtitles for a video, with tokenization if available
 */
export async function getVideoSubtitles(videoId: string): Promise<VideoSubtitle[]> {
  return db.getVideoSubtitles(videoId);
}

/**
 * Look up a word from subtitle click.
 * Checks knowledge_units table for matches.
 */
export async function lookupWord(
  surface: string,
  userId?: string
): Promise<WordLookupResult | null> {
  try {
    // Search in knowledge_units for vocabulary match
    const { data: vocabData } = await supabase
      .from('knowledge_units')
      .select(`
        id, slug, meaning, character, jlpt,
        vocabulary_details(reading, parts_of_speech, context_sentences)
      `)
      .eq('type', 'vocabulary')
      .or(`character.eq.${surface},slug.ilike.%${surface}%`)
      .limit(1)
      .maybeSingle();

    // Check if word is saved by user
    let isSaved = false;
    if (userId) {
      const { data: savedData } = await supabase
        .from('user_saved_words')
        .select('id')
        .eq('user_id', userId)
        .eq('surface', surface)
        .maybeSingle();
      isSaved = !!savedData;
    }

    if (vocabData) {
      const details = Array.isArray(vocabData.vocabulary_details)
        ? vocabData.vocabulary_details[0]
        : vocabData.vocabulary_details;

      return {
        surface,
        reading: details?.reading || surface,
        meaning: vocabData.meaning || '',
        jlpt: vocabData.jlpt,
        ku_id: vocabData.id,
        pos: details?.parts_of_speech?.[0] || null,
        example_sentences: details?.context_sentences || [],
        is_saved: isSaved,
      };
    }

    // Return basic result if not in knowledge base
    return {
      surface,
      reading: surface,
      meaning: '',
      jlpt: null,
      ku_id: null,
      pos: null,
      is_saved: isSaved,
    };
  } catch (error) {
    console.error('[VideoService] lookupWord error:', error);
    return null;
  }
}

/**
 * Look up grammar point by ku_id
 */
export async function lookupGrammar(kuId: string): Promise<any | null> {
  try {
    const { data } = await supabase
      .from('knowledge_units')
      .select(`
        id, slug, meaning, jlpt,
        grammar_details(structure, explanation, nuance, example_sentences)
      `)
      .eq('id', kuId)
      .eq('type', 'grammar')
      .maybeSingle();

    if (!data) return null;

    const details = Array.isArray(data.grammar_details)
      ? data.grammar_details[0]
      : data.grammar_details;

    return {
      id: data.id,
      slug: data.slug,
      meaning: data.meaning,
      jlpt: data.jlpt,
      structure: details?.structure,
      explanation: details?.explanation,
      nuance: details?.nuance,
      example_sentences: details?.example_sentences || [],
    };
  } catch (error) {
    console.error('[VideoService] lookupGrammar error:', error);
    return null;
  }
}

// ==========================================
// JLPT ANALYSIS
// ==========================================

/**
 * Analyze subtitles to compute JLPT distribution for a video.
 * Uses existing vocabulary data from knowledge_units.
 */
export async function analyzeVideoJLPT(videoId: string): Promise<JLPTDistribution> {
  try {
    const subtitles = await db.getVideoSubtitles(videoId);
    if (subtitles.length === 0) return {};

    // Collect all tokens from all subtitles
    const allTokens: SubtitleToken[] = subtitles.flatMap(s => s.tokens || []);

    // Count JLPT levels
    const counts: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0, unknown: 0 };
    let total = 0;

    for (const token of allTokens) {
      total++;
      if (token.jlpt) {
        const key = `N${token.jlpt}`;
        counts[key] = (counts[key] || 0) + 1;
      } else {
        counts.unknown = (counts.unknown || 0) + 1;
      }
    }

    if (total === 0) return {};

    // Convert to percentages
    const distribution: JLPTDistribution = {};
    if (counts.N5 > 0) distribution.N5 = Math.round((counts.N5 / total) * 100);
    if (counts.N4 > 0) distribution.N4 = Math.round((counts.N4 / total) * 100);
    if (counts.N3 > 0) distribution.N3 = Math.round((counts.N3 / total) * 100);
    if (counts.N2 > 0) distribution.N2 = Math.round((counts.N2 / total) * 100);
    if (counts.N1 > 0) distribution.N1 = Math.round((counts.N1 / total) * 100);
    if (counts.unknown > 0) distribution.unknown = Math.round((counts.unknown / total) * 100);

    // Determine dominant level (highest non-unknown percentage)
    const levelEntries = Object.entries(distribution)
      .filter(([k]) => k !== 'unknown')
      .sort(([, a], [, b]) => (b as number) - (a as number));

    const dominantLevel = levelEntries[0]?.[0];
    const dominantLevelNum = dominantLevel ? parseInt(dominantLevel.replace('N', '')) : null;

    if (dominantLevelNum) {
      await db.updateVideoJLPT(videoId, dominantLevelNum, distribution as Record<string, number>);
    }

    return distribution;
  } catch (error) {
    console.error('[VideoService] analyzeVideoJLPT error:', error);
    return {};
  }
}

/**
 * Compute vocabulary statistics for a video from its subtitles.
 */
export async function computeVideoVocabStats(videoId: string): Promise<VideoVocabStat[]> {
  try {
    const subtitles = await db.getVideoSubtitles(videoId);
    if (subtitles.length === 0) return [];

    // Aggregate word frequencies
    const wordMap = new Map<string, VideoVocabStat>();

    for (const subtitle of subtitles) {
      for (const token of (subtitle.tokens || [])) {
        if (!token.surface || token.surface.trim().length === 0) continue;

        // Skip particles, punctuation, etc.
        if (token.pos && ['助詞', '助動詞', '記号', '補助記号'].includes(token.pos)) continue;

        const existing = wordMap.get(token.surface);
        if (existing) {
          existing.frequency++;
        } else {
          wordMap.set(token.surface, {
            video_id: videoId,
            ku_id: token.ku_id || null,
            surface: token.surface,
            reading: token.reading || null,
            frequency: 1,
            jlpt: token.jlpt || null,
            meaning: token.meaning || null,
          });
        }
      }
    }

    const stats = Array.from(wordMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    // Save to database
    if (stats.length > 0) {
      await db.upsertVideoVocabStats(stats);
    }

    return stats;
  } catch (error) {
    console.error('[VideoService] computeVideoVocabStats error:', error);
    return [];
  }
}

/**
 * Get vocabulary stats for a video (from cache or compute)
 */
export async function getVideoVocabStats(videoId: string): Promise<VideoVocabStat[]> {
  const cached = await db.getVideoVocabStats(videoId);
  if (cached.length > 0) return cached;

  // Compute if not cached
  return computeVideoVocabStats(videoId);
}

// ==========================================
// USER LIBRARY
// ==========================================

export async function getUserLibrary(
  userId: string,
  filters?: Partial<LibraryFilters>
): Promise<UserVideoLibraryEntry[]> {
  const entries = await db.getUserLibrary(userId, {
    categoryId: filters?.categoryId || undefined,
    isFavorite: filters?.filterBy === 'favorites' ? true : undefined,
  });

  let filtered = entries;

  // Apply progress filter
  if (filters?.filterBy === 'in_progress') {
    filtered = filtered.filter(e => {
      const p = e.progress;
      return p && p.progress_percent > 0 && p.progress_percent < 95;
    });
  } else if (filters?.filterBy === 'completed') {
    filtered = filtered.filter(e => e.progress?.completed === true);
  } else if (filters?.filterBy === 'not_started') {
    filtered = filtered.filter(e => !e.progress || e.progress.progress_percent === 0);
  }

  // Apply JLPT filter
  if (filters?.jlptLevel) {
    filtered = filtered.filter(e => e.video?.jlpt_level === filters.jlptLevel);
  }

  // Apply search
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(e =>
      e.video?.title.toLowerCase().includes(q) ||
      e.video?.channel_name?.toLowerCase().includes(q)
    );
  }

  // Apply sort
  if (filters?.sortBy === 'progress') {
    filtered.sort((a, b) => (b.progress?.progress_percent || 0) - (a.progress?.progress_percent || 0));
  } else if (filters?.sortBy === 'title') {
    filtered.sort((a, b) => (a.video?.title || '').localeCompare(b.video?.title || ''));
  } else if (filters?.sortBy === 'jlpt_level') {
    filtered.sort((a, b) => (a.video?.jlpt_level || 99) - (b.video?.jlpt_level || 99));
  }
  // Default: date_added (already sorted by DB)

  return filtered;
}

export async function addToLibrary(userId: string, req: AddToLibraryRequest): Promise<UserVideoLibraryEntry> {
  return db.addToLibrary(userId, req);
}

export async function removeFromLibrary(userId: string, videoId: string): Promise<void> {
  return db.removeFromLibrary(userId, videoId);
}

export async function isVideoInLibrary(userId: string, videoId: string): Promise<boolean> {
  return db.isVideoInLibrary(userId, videoId);
}

export async function toggleFavorite(userId: string, videoId: string, isFavorite: boolean): Promise<void> {
  return db.updateLibraryEntry(userId, videoId, { is_favorite: isFavorite });
}

export async function assignCategory(userId: string, videoId: string, categoryId: string | null): Promise<void> {
  return db.updateLibraryEntry(userId, videoId, { category_id: categoryId });
}

// ==========================================
// CATEGORIES
// ==========================================

export async function getUserCategories(userId: string): Promise<VideoCategory[]> {
  return db.getUserCategories(userId);
}

export async function createCategory(userId: string, req: CreateCategoryRequest): Promise<VideoCategory> {
  return db.createCategory(userId, req);
}

export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  return db.deleteCategory(categoryId, userId);
}

// ==========================================
// PROGRESS
// ==========================================

export async function getVideoProgress(userId: string, videoId: string): Promise<VideoProgress | null> {
  return db.getVideoProgress(userId, videoId);
}

export async function updateVideoProgress(userId: string, req: UpdateProgressRequest): Promise<VideoProgress> {
  return db.upsertVideoProgress(userId, req);
}

// ==========================================
// SAVED WORDS
// ==========================================

export async function saveWord(userId: string, req: SaveWordRequest): Promise<void> {
  await db.saveWord(userId, req);
}

export async function removeSavedWord(userId: string, surface: string): Promise<void> {
  await db.removeSavedWord(userId, surface);
}

export async function getUserSavedWords(userId: string, videoId?: string) {
  return db.getUserSavedWords(userId, videoId);
}

// ==========================================
// GRAMMAR BOOKMARKS
// ==========================================

export async function bookmarkGrammar(
  userId: string,
  kuId: string,
  options?: { source_video_id?: string; source_timestamp_ms?: number; context_sentence?: string }
): Promise<void> {
  await db.bookmarkGrammar(userId, kuId, options);
}

export async function removeGrammarBookmark(userId: string, kuId: string): Promise<void> {
  await db.removeGrammarBookmark(userId, kuId);
}

export async function getUserGrammarBookmarks(userId: string) {
  return db.getUserGrammarBookmarks(userId);
}

// ==========================================
// DICTATION PRACTICE
// ==========================================

/**
 * Create a new dictation session for a video
 */
export async function createDictationSession(
  videoId: string,
  settings?: DictationSettings
): Promise<DictationSession> {
  try {
    const response = await fetch('/api/dictation/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        settings,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create session' }));
      return {
        success: false,
        video_id: videoId,
        subtitles: [],
        total_subtitles: 0,
        error: error.error || 'Failed to create session',
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating dictation session:', error);
    return {
      success: false,
      video_id: videoId,
      subtitles: [],
      total_subtitles: 0,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Submit a dictation attempt
 */
export async function submitDictationAttempt(
  sessionId: string,
  subtitleId: string,
  userInput: string,
  timeTakenMs: number = 0
): Promise<DictationAttemptResponse> {
  try {
    const response = await fetch(`/api/dictation/session/${sessionId}/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subtitle_id: subtitleId,
        user_input: userInput,
        time_taken_ms: timeTakenMs,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to submit attempt' }));
      return {
        success: false,
        is_complete: false,
        remaining: 0,
        error: error.error || 'Failed to submit attempt',
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error submitting dictation attempt:', error);
    return {
      success: false,
      is_complete: false,
      remaining: 0,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Get dictation stats for the current user
 */
export async function getDictationStats(): Promise<DictationStats> {
  try {
    const response = await fetch('/api/dictation/stats');

    if (!response.ok) {
      return {
        total_sessions: 0,
        total_attempts: 0,
        average_accuracy: 0,
        videos_practiced: 0,
        current_streak: 0,
        best_accuracy: 0,
      };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error getting dictation stats:', error);
    return {
      total_sessions: 0,
      total_attempts: 0,
      average_accuracy: 0,
      videos_practiced: 0,
      current_streak: 0,
      best_accuracy: 0,
    };
  }
}
