/**
 * WaniKani v2 API Types (TypeScript)
 * Matches the Pydantic models in the FastAPI backend.
 */

// ── Base Wrappers ─────────────────────────────────────────────

export interface PagesInfo {
  per_page: number;
  next_url: string | null;
  previous_url: string | null;
}

export interface BaseResource<T> {
  id: number;
  object: string;
  url: string;
  data_updated_at: string | null;
  data: T;
}

export interface BaseCollection<T> {
  object: string;
  url: string;
  pages: PagesInfo;
  total_count: number;
  data_updated_at: string | null;
  data: T[];
}

// ── Subject Types ─────────────────────────────────────────────

export type SubjectType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface MeaningEntry {
  meaning: string;
  primary: boolean;
  accepted_answer: boolean;
}

export interface ReadingEntry {
  reading: string;
  type: string; // onyomi, kunyomi, nanori
  primary: boolean;
  accepted_answer: boolean;
}

export interface SubjectData {
  auxiliary_meanings: MeaningEntry[];
  characters: string | null;
  created_at: string | null;
  document_url: string | null;
  hidden_at: string | null;
  lesson_position: number;
  level: number;
  meanings: MeaningEntry[];
  meaning_mnemonic: string | null;
  readings: ReadingEntry[];
  reading_mnemonic: string | null;
  slug: string;
  spaced_repetition_system_id: number;
  // Type-specific fields
  component_subject_ids: number[];
  amalgamation_subject_ids: number[];
  visually_similar_subject_ids: number[];
  meaning_hint: string | null;
  reading_hint: string | null;
  parts_of_speech: string[];
  context_sentences: any[];
  pronunciation_audios: any[];
  // Grammar-specific
  structure: any | null;
  explanation: string | null;
  jlpt: number | null;
}

export type SubjectResource = BaseResource<SubjectData>;
export type SubjectCollection = BaseCollection<SubjectResource>;

// ── Assignment ────────────────────────────────────────────────

export interface AssignmentData {
  available_at: string | null;
  burned_at: string | null;
  created_at: string | null;
  hidden: boolean;
  passed_at: string | null;
  resurrected_at: string | null;
  srs_stage: number;
  started_at: string | null;
  subject_id: number;
  subject_type: SubjectType;
  unlocked_at: string | null;
  subject?: SubjectResource;
}

export type AssignmentResource = BaseResource<AssignmentData>;
export type AssignmentCollection = BaseCollection<AssignmentResource>;

// ── Review ────────────────────────────────────────────────────

export interface ReviewCreateRequest {
  assignment_id: number;
  incorrect_meaning_answers: number;
  incorrect_reading_answers: number;
}

export interface ReviewData {
  assignment_id: number;
  subject_id: number;
  spaced_repetition_system_id: number | null;
  starting_srs_stage: number;
  ending_srs_stage: number;
  incorrect_meaning_answers: number;
  incorrect_reading_answers: number;
  created_at: string | null;
}

export type ReviewResource = BaseResource<ReviewData>;

export interface ReviewCreateResponse extends ReviewResource {
  resources_updated: {
    assignment?: AssignmentResource;
  };
}

// ── Summary ──────────────────────────────────────────────────

export interface SummaryLesson {
  available_at: string;
  subject_ids: number[];
}

export interface SummaryReview {
  available_at: string;
  subject_ids: number[];
}

export interface SummaryData {
  lessons: SummaryLesson[];
  next_reviews_at: string | null;
  reviews: SummaryReview[];
}

export type SummaryResource = BaseResource<SummaryData>;

// ── Custom Deck ───────────────────────────────────────────────

export interface CustomDeckConfigData {
  preset: string;
  srs_system_id: number;
  interval_multiplier: number;
  lessons_per_session: number;
  max_reviews_per_day: number | null;
  auto_advance_level: boolean;
  shuffle_reviews: boolean;
}

export interface CustomDeckData {
  name: string;
  description: string | null;
  current_level: number;
  config: CustomDeckConfigData;
  created_at: string | null;
}

export type CustomDeckResource = BaseResource<CustomDeckData>;
export type CustomDeckCollection = BaseCollection<CustomDeckResource>;

export interface CustomDeckItemData {
  deck_id: number;
  subject_id: number;
  custom_level: number;
  created_at: string | null;
}

export type CustomDeckItemResource = BaseResource<CustomDeckItemData>;

export interface CustomDeckCreateRequest {
  name: string;
  description?: string;
  config?: Partial<CustomDeckConfigData>;
}

export interface CustomDeckUpdateRequest {
  name?: string;
  description?: string;
  config?: Partial<CustomDeckConfigData>;
}

// ── User ──────────────────────────────────────────────────────

export interface UserData {
  id: string;
  username: string | null;
  level: number;
  profile_url: string | null;
  started_at: string | null;
  current_vacation_started_at: string | null;
  subscription: any;
  preferences: any;
}

export type UserResource = BaseResource<UserData>;
