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
  CustomDeckItemResource
} from '@/types/wanikani';

/**
 * Client for interacting with the WaniKani-style v2 API
 */
class WanikaniClient extends ServerApiClient {
  private baseRoute = WANIKANI_API_V2_BASE_URL;

  // ── Subjects ────────────────────────────────────────────────

  async listSubjects(params: {
    ids?: number[];
    types?: string[];
    levels?: number[];
    slugs?: string[];
    hidden?: boolean;
    page_after_id?: number;
  } = {}): Promise<SubjectCollection> {
    return this.get(`${this.baseRoute}/subjects`, { params });
  }

  async getSubject(id: number): Promise<SubjectResource> {
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
    subject_ids?: number[];
    subject_types?: string[];
    unlocked?: boolean;
    started?: boolean;
  } = {}): Promise<AssignmentCollection> {
    return this.get(`${this.baseRoute}/assignments`, { params });
  }

  async getAssignment(id: number): Promise<AssignmentResource> {
    return this.get(`${this.baseRoute}/assignments/${id}`);
  }

  async startAssignment(id: number): Promise<AssignmentResource> {
    return this.post(`${this.baseRoute}/assignments/${id}/start`, {});
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
    return this.get(`${this.baseRoute}/decks`);
  }

  async createDeck(payload: CustomDeckCreateRequest): Promise<CustomDeckResource> {
    return this.post(`${this.baseRoute}/decks`, payload);
  }

  async getDeck(id: number): Promise<CustomDeckResource> {
    return this.get(`${this.baseRoute}/decks/${id}`);
  }

  async updateDeck(id: number, payload: CustomDeckUpdateRequest): Promise<CustomDeckResource> {
    return this.patch(`${this.baseRoute}/decks/${id}`, payload);
  }

  async deleteDeck(id: number): Promise<void> {
    return this.delete(`${this.baseRoute}/decks/${id}`);
  }

  // ── Deck Items ──────────────────────────────────────────────

  async listDeckItems(deckId: number): Promise<BaseCollection<CustomDeckItemResource>> {
    return this.get(`${this.baseRoute}/decks/${deckId}/items`);
  }

  async addDeckItems(deckId: number, subjectIds: number[], customLevel?: number): Promise<void> {
    return this.post(`${this.baseRoute}/decks/${deckId}/items`, {
      subject_ids: subjectIds,
      custom_level: customLevel
    });
  }

  async removeDeckItem(deckId: number, subjectId: number): Promise<void> {
    return this.delete(`${this.baseRoute}/decks/${deckId}/items/${subjectId}`);
  }
}

export const wanikaniClient = new WanikaniClient();
export default wanikaniClient;
