// ==========================================
// VIDEO LEARNING FEATURE - DATABASE LAYER
// ==========================================

import { supabase } from '@/lib/supabase';
import type {
  Video,
  VideoSubtitle,
  VideoVocabStat,
  VideoCategory,
  UserVideoLibraryEntry,
  VideoProgress,
  UserSavedWord,
  UserGrammarBookmark,
  AddToLibraryRequest,
  UpdateProgressRequest,
  CreateCategoryRequest,
  SaveWordRequest,
} from './types';

// ==========================================
// VIDEOS
// ==========================================

export async function getVideoById(videoId: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getVideoByYoutubeId(youtubeId: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('youtube_id', youtubeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function searchVideos(query: string, jlptLevel?: number, limit = 20): Promise<Video[]> {
  let q = supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) {
    q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,channel_name.ilike.%${query}%`);
  }

  if (jlptLevel) {
    q = q.eq('jlpt_level', jlptLevel);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertVideo(video: Partial<Video> & { youtube_id: string; title: string }): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .upsert(video, { onConflict: 'youtube_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVideoJLPT(videoId: string, jlptLevel: number, distribution: Record<string, number>): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({
      jlpt_level: jlptLevel,
      jlpt_distribution: distribution,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);

  if (error) throw error;
}

// ==========================================
// SUBTITLES
// ==========================================

export async function getVideoSubtitles(videoId: string): Promise<VideoSubtitle[]> {
  const { data, error } = await supabase
    .from('video_subtitles')
    .select('*')
    .eq('video_id', videoId)
    .order('start_time_ms', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertSubtitles(subtitles: Omit<VideoSubtitle, 'id' | 'created_at'>[]): Promise<void> {
  if (subtitles.length === 0) return;

  // Delete existing subtitles for this video first
  const videoId = subtitles[0].video_id;
  await supabase.from('video_subtitles').delete().eq('video_id', videoId);

  // Insert new subtitles in batches of 100
  const batchSize = 100;
  for (let i = 0; i < subtitles.length; i += batchSize) {
    const batch = subtitles.slice(i, i + batchSize);
    const { error } = await supabase.from('video_subtitles').insert(batch);
    if (error) throw error;
  }
}

// ==========================================
// VOCABULARY STATS
// ==========================================

export async function getVideoVocabStats(videoId: string, limit = 100): Promise<VideoVocabStat[]> {
  const { data, error } = await supabase
    .from('video_vocab_stats')
    .select('*')
    .eq('video_id', videoId)
    .order('frequency', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function upsertVideoVocabStats(stats: Omit<VideoVocabStat, never>[]): Promise<void> {
  if (stats.length === 0) return;

  const videoId = stats[0].video_id;
  await supabase.from('video_vocab_stats').delete().eq('video_id', videoId);

  const { error } = await supabase.from('video_vocab_stats').insert(stats);
  if (error) throw error;
}

// ==========================================
// VIDEO CATEGORIES
// ==========================================

export async function getUserCategories(userId: string): Promise<VideoCategory[]> {
  const { data, error } = await supabase
    .from('video_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCategory(userId: string, req: CreateCategoryRequest): Promise<VideoCategory> {
  const { data, error } = await supabase
    .from('video_categories')
    .insert({
      user_id: userId,
      name: req.name,
      color: req.color || '#F4ACB7',
      icon: req.icon || '📚',
      description: req.description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(categoryId: string, userId: string, updates: Partial<VideoCategory>): Promise<VideoCategory> {
  const { data, error } = await supabase
    .from('video_categories')
    .update(updates)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('video_categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ==========================================
// USER VIDEO LIBRARY
// ==========================================

export async function getUserLibrary(
  userId: string,
  options?: {
    categoryId?: string;
    isFavorite?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<UserVideoLibraryEntry[]> {
  let q = supabase
    .from('user_video_library')
    .select(`
      *,
      category:video_categories(*),
      video:videos(
        *,
        progress:video_progress(*)
      )
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (options?.categoryId) {
    q = q.eq('category_id', options.categoryId);
  }

  if (options?.isFavorite !== undefined) {
    q = q.eq('is_favorite', options.isFavorite);
  }

  if (options?.limit) {
    q = q.limit(options.limit);
  }

  if (options?.offset) {
    q = q.range(options.offset, (options.offset + (options.limit || 20)) - 1);
  }

  const { data, error } = await q;
  if (error) throw error;

  // Flatten progress from video -> progress to the root entry
  return (data || []).map((entry: any) => {
    const progressArray = entry.video?.progress;
    const progress = Array.isArray(progressArray) ? progressArray[0] || null : progressArray || null;

    // Create clean video object without nested progress to match types
    const video = entry.video ? { ...entry.video } : undefined;
    if (video) delete video.progress;

    return {
      ...entry,
      video,
      progress,
    };
  });
}

export async function isVideoInLibrary(userId: string, videoId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_video_library')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  return !!data;
}

export async function addToLibrary(userId: string, req: AddToLibraryRequest): Promise<UserVideoLibraryEntry> {
  const { data, error } = await supabase
    .from('user_video_library')
    .upsert({
      user_id: userId,
      video_id: req.video_id,
      category_id: req.category_id || null,
      notes: req.notes || null,
    }, { onConflict: 'user_id,video_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromLibrary(userId: string, videoId: string): Promise<void> {
  const { error } = await supabase
    .from('user_video_library')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (error) throw error;
}

export async function updateLibraryEntry(
  userId: string,
  videoId: string,
  updates: { category_id?: string | null; notes?: string; is_favorite?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('user_video_library')
    .update(updates)
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (error) throw error;
}

// ==========================================
// VIDEO PROGRESS
// ==========================================

export async function getVideoProgress(userId: string, videoId: string): Promise<VideoProgress | null> {
  const { data, error } = await supabase
    .from('video_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertVideoProgress(userId: string, req: UpdateProgressRequest): Promise<VideoProgress> {
  const existing = await getVideoProgress(userId, req.video_id);

  const { data, error } = await supabase
    .from('video_progress')
    .upsert({
      user_id: userId,
      video_id: req.video_id,
      last_position_ms: req.last_position_ms,
      progress_percent: req.progress_percent,
      completed: req.completed || req.progress_percent >= 95,
      watch_count: req.completed && !existing?.completed ? (existing?.watch_count || 0) + 1 : (existing?.watch_count || 0),
      last_watched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==========================================
// SAVED WORDS
// ==========================================

export async function getUserSavedWords(userId: string, videoId?: string): Promise<UserSavedWord[]> {
  let q = supabase
    .from('user_saved_words')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (videoId) {
    q = q.eq('source_video_id', videoId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function saveWord(userId: string, req: SaveWordRequest): Promise<UserSavedWord> {
  const { data, error } = await supabase
    .from('user_saved_words')
    .upsert({
      user_id: userId,
      surface: req.surface,
      reading: req.reading || null,
      meaning: req.meaning || null,
      jlpt: req.jlpt || null,
      ku_id: req.ku_id || null,
      source_video_id: req.source_video_id || null,
      source_timestamp_ms: req.source_timestamp_ms || null,
    }, { onConflict: 'user_id,surface' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeSavedWord(userId: string, surface: string): Promise<void> {
  const { error } = await supabase
    .from('user_saved_words')
    .delete()
    .eq('user_id', userId)
    .eq('surface', surface);

  if (error) throw error;
}

export async function isWordSaved(userId: string, surface: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_saved_words')
    .select('id')
    .eq('user_id', userId)
    .eq('surface', surface)
    .maybeSingle();

  return !!data;
}

// ==========================================
// GRAMMAR BOOKMARKS
// ==========================================

export async function getUserGrammarBookmarks(userId: string): Promise<UserGrammarBookmark[]> {
  const { data, error } = await supabase
    .from('user_grammar_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('bookmarked_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function bookmarkGrammar(
  userId: string,
  kuId: string,
  options?: {
    source_video_id?: string;
    source_timestamp_ms?: number;
    context_sentence?: string;
  }
): Promise<UserGrammarBookmark> {
  const { data, error } = await supabase
    .from('user_grammar_bookmarks')
    .upsert({
      user_id: userId,
      ku_id: kuId,
      source_video_id: options?.source_video_id || null,
      source_timestamp_ms: options?.source_timestamp_ms || null,
      context_sentence: options?.context_sentence || null,
    }, { onConflict: 'user_id,ku_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeGrammarBookmark(userId: string, kuId: string): Promise<void> {
  const { error } = await supabase
    .from('user_grammar_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('ku_id', kuId);

  if (error) throw error;
}
