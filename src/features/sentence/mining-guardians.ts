
/**
 * Business rules for validating "study-worthy" sentences (Mining Guardians).
 * Used for YouTube Mining (UC-04.5) and Chat Mining (UC-05.5).
 */

export interface SourceMetadata {
    type: 'youtube' | 'chat' | 'manual';
    qualityScore?: number; // 0-1 (e.g., transcript accuracy)
}

export interface MiningGuardResult {
    isValid: boolean;
    rejectionReason?: string;
}

/**
 * Validates if a sentence is suitable for flashcard creation.
 * Rules:
 * - Length: 5 to 50 characters.
 * - Quality: Must have at least 0.8 quality score if from YouTube auto-transcripts.
 * - Density: Must contain at least one CKB Knowledge Unit.
 */
export function validateForMining(
    text: string,
    source: SourceMetadata,
    mappedKuCount: number
): MiningGuardResult {
    // Length check
    if (text.length < 5) return { isValid: false, rejectionReason: 'Sentence too short' };
    if (text.length > 50) return { isValid: false, rejectionReason: 'Sentence too long' };

    // Density check
    if (mappedKuCount === 0) return { isValid: false, rejectionReason: 'No known knowledge units found' };

    // Source quality check
    if (source.type === 'youtube' && (source.qualityScore || 1) < 0.8) {
        return { isValid: false, rejectionReason: 'Low quality transcript source' };
    }

    return { isValid: true };
}

/**
 * Rule: Multi-source validation.
 * A sentence is high priority if it has been encountered in multiple sources.
 */
export function isHighPriorityCandidate(encounters: number): boolean {
    return encounters >= 3;
}
