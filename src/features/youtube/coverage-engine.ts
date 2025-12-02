
/**
 * Business rules for calculating vocabulary coverage in content.
 */

export interface CoverageReport {
    totalWords: number;
    knownWords: number;
    coveragePercentage: number;
    iPlusOneWords: string[]; // List of words the user is ready to learn
}

/**
 * Calculates the coverage percentage of a video based on the user's known KU set.
 */
export function calculateCoverage(videoTokens: string[], knownKuSlugs: Set<string>): CoverageReport {
    const uniqueTokens = [...new Set(videoTokens)];
    const totalWords = uniqueTokens.length;

    if (totalWords === 0) {
        return { totalWords: 0, knownWords: 0, coveragePercentage: 0, iPlusOneWords: [] };
    }

    const knownWords = uniqueTokens.filter(token => knownKuSlugs.has(token)).length;
    const coveragePercentage = (knownWords / totalWords) * 100;

    // Simplistic "i+1": New words in the video
    const iPlusOneWords = uniqueTokens.filter(token => !knownKuSlugs.has(token));

    return {
        totalWords,
        knownWords,
        coveragePercentage,
        iPlusOneWords
    };
}

/**
 * Determines if a video is "Comprehensible Input" (Target 80-95% coverage).
 */
export function isComprehensible(report: CoverageReport): boolean {
    return report.coveragePercentage >= 80 && report.coveragePercentage <= 98;
}
