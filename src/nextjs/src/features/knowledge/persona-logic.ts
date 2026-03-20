
import { KnowledgeUnit } from './types';

/**
 * Business rules for user personalization of knowledge units.
 */

export interface UserPersonalization {
    bookmarkedIds: string[];
    knownIds: string[];
}

/**
 * Checks if a Knowledge Unit is bookmarked by the user.
 */
export function isBookmarked(unitId: string, personalization: UserPersonalization): boolean {
    return personalization.bookmarkedIds.includes(unitId);
}

/**
 * Checks if a Knowledge Unit is manually marked as "already known" by the user.
 * This is separate from SRS state; it's a manual bypass.
 */
export function isMarkedKnown(unitId: string, personalization: UserPersonalization): boolean {
    return personalization.knownIds.includes(unitId);
}

/**
 * Logic to toggle bookmark state.
 */
export function toggleBookmark(unitId: string, personalization: UserPersonalization): string[] {
    if (personalization.bookmarkedIds.includes(unitId)) {
        return personalization.bookmarkedIds.filter(id => id !== unitId);
    }
    return [...personalization.bookmarkedIds, unitId];
}

/**
 * Logic to mark/unmark as known.
 */
export function toggleKnownMarker(unitId: string, personalization: UserPersonalization): string[] {
    if (personalization.knownIds.includes(unitId)) {
        return personalization.knownIds.filter(id => id !== unitId);
    }
    return [...personalization.knownIds, unitId];
}
