// ==========================================
// VIDEO LEARNING FEATURE - TYPES
// ==========================================

export interface Video {
  id: string;
  youtube_id: string | null;
  title: string;
  description: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  language: string;
  jlpt_level: number | null;
  jlpt_distribution: JLPTDistribution;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JLPTDistribution {
  N5?: number;
  N4?: number;
  N3?: number;
  N2?: number;
  N1?: number;
  unknown?: number;
}

export interface SubtitleToken {
  surface: string;       // Surface form (displayed text)
  reading?: string;      // Hiragana reading
  pos?: string;          // Part of speech
  jlpt?: number;         // JLPT level (1-5)
  ku_id?: string;        // Knowledge unit ID if matched
  meaning?: string;      // Cached meaning
  start_char?: number;   // Character position in text
  end_char?: number;
}

export interface GrammarPoint {
  pattern: string;       // Grammar pattern name
  ku_id?: string;        // Knowledge unit ID
  start_char: number;    // Start position in text
  end_char: number;      // End position in text
  jlpt?: number;
  explanation?: string;
}

export interface VideoSubtitle {
  id: string;
  video_id: string;
  start_time_ms: number;
  end_time_ms: number;
  text: string;
  tokens: SubtitleToken[];
  grammar_points: GrammarPoint[];
}

export interface VideoVocabStat {
  video_id: string;
  ku_id: string | null;
  surface: string;
  reading: string | null;
  frequency: number;
  jlpt: number | null;
  meaning: string | null;
}

// ==========================================
// USER LIBRARY TYPES
// ==========================================

export interface VideoCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface UserVideoLibraryEntry {
  id: string;
  user_id: string;
  video_id: string;
  category_id: string | null;
  notes: string | null;
  is_favorite: boolean;
  added_at: string;
  // Joined data
  video?: Video;
  category?: VideoCategory;
  progress?: VideoProgress;
}

export interface VideoProgress {
  user_id: string;
  video_id: string;
  last_position_ms: number;
  progress_percent: number;
  completed: boolean;
  watch_count: number;
  last_watched_at: string;
  created_at: string;
}

export interface UserSavedWord {
  id: string;
  user_id: string;
  ku_id: string | null;
  surface: string;
  reading: string | null;
  meaning: string | null;
  jlpt: number | null;
  source_video_id: string | null;
  source_timestamp_ms: number | null;
  notes: string | null;
  saved_at: string;
}

export interface UserGrammarBookmark {
  id: string;
  user_id: string;
  ku_id: string;
  source_video_id: string | null;
  source_timestamp_ms: number | null;
  context_sentence: string | null;
  notes: string | null;
  bookmarked_at: string;
}

// ==========================================
// UI STATE TYPES
// ==========================================

export type LibraryViewMode = 'grid' | 'list';
export type LibrarySortBy = 'date_added' | 'progress' | 'title' | 'jlpt_level';
export type LibraryFilterBy = 'all' | 'in_progress' | 'completed' | 'not_started' | 'favorites';

export interface LibraryFilters {
  view: LibraryViewMode;
  sortBy: LibrarySortBy;
  filterBy: LibraryFilterBy;
  categoryId: string | null;
  jlptLevel: number | null;
  searchQuery: string;
}

export interface WordLookupResult {
  surface: string;
  reading: string;
  meaning: string;
  jlpt: number | null;
  ku_id: string | null;
  pos: string | null;
  grammar_explanation?: string;
  example_sentences?: Array<{ ja: string; en: string }>;
  is_saved: boolean;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface AddToLibraryRequest {
  video_id: string;
  category_id?: string;
  notes?: string;
}

export interface UpdateProgressRequest {
  video_id: string;
  last_position_ms: number;
  progress_percent: number;
  completed?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface SaveWordRequest {
  surface: string;
  reading?: string;
  meaning?: string;
  jlpt?: number;
  ku_id?: string;
  source_video_id?: string;
  source_timestamp_ms?: number;
}

export interface VideoWithProgress extends Video {
  progress?: VideoProgress;
  library_entry?: UserVideoLibraryEntry;
}

// JLPT level colors for UI
export const JLPT_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
  5: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7', label: 'N5' },
  4: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', label: 'N4' },
  3: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', label: 'N3' },
  2: { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1', label: 'N2' },
  1: { bg: '#EDE7F6', text: '#4527A0', border: '#CE93D8', label: 'N1' },
};

export const JLPT_LEVEL_NAMES: Record<number, string> = {
  5: 'N5 — Beginner',
  4: 'N4 — Elementary',
  3: 'N3 — Intermediate',
  2: 'N2 — Upper Intermediate',
  1: 'N1 — Advanced',
};
