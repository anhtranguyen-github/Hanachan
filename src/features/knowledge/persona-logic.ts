
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
export function isBookmarked(kuId: string, personalization: UserPersonalization): boolean {
    return personalization.bookmarkedIds.includes(kuId);
}

/**
 * Checks if a Knowledge Unit is manually marked as "already known" by the user.
 * This is separate from SRS state; it's a manual bypass.
 */
export function isMarkedKnown(kuId: string, personalization: UserPersonalization): boolean {
    return personalization.knownIds.includes(kuId);
}

/**
 * Logic to toggle bookmark state.
 */
export function toggleBookmark(kuId: string, personalization: UserPersonalization): string[] {
    if (personalization.bookmarkedIds.includes(kuId)) {
        return personalization.bookmarkedIds.filter(id => id !== kuId);
    }
    return [...personalization.bookmarkedIds, kuId];
}

/**
 * Logic to mark/unmark as known.
 */
export function toggleKnownMarker(kuId: string, personalization: UserPersonalization): string[] {
    if (personalization.knownIds.includes(kuId)) {
        return personalization.knownIds.filter(id => id !== kuId);
    }
    return [...personalization.knownIds, kuId];
}
