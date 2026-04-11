import ServerApiClient from './serverApiClient';
import { WANIKANI_API_V2_BASE_URL } from '@/config/api';
import {
  SubjectResource,
  SubjectCollection,
  AssignmentResource,
  AssignmentCollection,
  BaseCollection,
  SummaryResource,
  ReviewResource,
  ReviewCreateRequest,
  ReviewCreateResponse,
  CustomDeckResource,
  CustomDeckCollection,
  CustomDeckCreateRequest,
  CustomDeckUpdateRequest,
  CustomDeckItemResource,
  CustomDeckProgressCollection,
  CustomDeckProgressResource,
  CustomDeckReviewCreateRequest
} from '@/types/wanikani';

/**
 * Client for interacting with the WaniKani-style v2 API
 */
class WanikaniClient extends ServerApiClient {
  private baseRoute = WANIKANI_API_V2_BASE_URL;

  // ── Subjects ────────────────────────────────────────────────

  async listSubjects(params: {
    ids?: (number | string)[];
    types?: string[];
    levels?: number[];
    slugs?: string[];
    hidden?: boolean;
    page_after_id?: number | string;
  } = {}): Promise<SubjectCollection> {
    return this.get(`${this.baseRoute}/subjects`, { params });
  }

  async getSubject(id: number | string): Promise<SubjectResource> {
    return this.get(`${this.baseRoute}/subjects/${id}`);
  }

  // ── Assignments ─────────────────────────────────────────────

  async listAssignments(params: {
    available_before?: string;
    available_after?: string;
    burned?: boolean;
    hidden?: boolean;
    immediately_available_for_lessons?: boolean;
    immediately_available_for_review?: boolean;
    levels?: number[];
    srs_stages?: number[];
    subject_ids?: (number | string)[];
    subject_types?: string[];
    unlocked?: boolean;
    started?: boolean;
  } = {}): Promise<AssignmentCollection> {
    return this.get(`${this.baseRoute}/assignments`, { params });
  }

  async getAssignment(id: number | string): Promise<AssignmentResource> {
    return this.get(`${this.baseRoute}/assignments/${id}`);
  }

  async startAssignment(id: number | string): Promise<AssignmentResource> {
    return this.put(`${this.baseRoute}/assignments/${id}/start`, {});
  }

  // ── Reviews ─────────────────────────────────────────────────

  async createReview(payload: ReviewCreateRequest): Promise<ReviewCreateResponse> {
    return this.post(`${this.baseRoute}/reviews`, payload);
  }

  // ── Summary ─────────────────────────────────────────────────

  async getSummary(): Promise<SummaryResource> {
    return this.get(`${this.baseRoute}/summary`);
  }

  // ── Custom Decks ────────────────────────────────────────────

  async listDecks(): Promise<CustomDeckCollection> {
    return this.get(`${this.baseRoute}/custom_decks`);
  }

  async createDeck(payload: CustomDeckCreateRequest): Promise<CustomDeckResource> {
    return this.post(`${this.baseRoute}/custom_decks`, payload);
  }

  async getDeck(id: number | string): Promise<CustomDeckResource> {
    return this.get(`${this.baseRoute}/custom_decks/${id}`);
  }

  async updateDeck(id: number | string, payload: CustomDeckUpdateRequest): Promise<CustomDeckResource> {
    return this.patch(`${this.baseRoute}/custom_decks/${id}`, payload);
  }

  async deleteDeck(id: number | string): Promise<void> {
    return this.delete(`${this.baseRoute}/custom_decks/${id}`);
  }

  // ── Deck Items ──────────────────────────────────────────────

  async listDeckItems(deckId: number | string): Promise<BaseCollection<CustomDeckItemResource>> {
    return this.get(`${this.baseRoute}/custom_decks/${deckId}/items`);
  }

  async addDeckItem(deckId: number | string, subjectId: number | string, customLevel: number): Promise<CustomDeckItemResource> {
    return this.post(`${this.baseRoute}/custom_decks/${deckId}/items`, {
      subject_id: subjectId,
      custom_level: customLevel
    });
  }

  async listDeckReviews(deckId: number | string): Promise<CustomDeckProgressCollection> {
    return this.get(`${this.baseRoute}/custom_decks/${deckId}/reviews`);
  }

  async createDeckReview(deckId: number | string, payload: CustomDeckReviewCreateRequest): Promise<CustomDeckProgressResource> {
    return this.post(`${this.baseRoute}/custom_decks/${deckId}/reviews`, payload);
  }
}

export const wanikaniClient = new WanikaniClient();
export default wanikaniClient;
