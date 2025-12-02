
/**
 * Business rules for aggregating and projecting memory strength.
 */

export interface MemoryPoint {
    stability: number;
}

export interface MemoryDistribution {
    weak: number;     // stability < 7 days
    moderate: number; // 7 <= stability < 30 days
    strong: number;   // stability >= 30 days
}

/**
 * Distributes KUs into memory strength buckets.
 */
export function calculateMemoryDistribution(points: MemoryPoint[]): MemoryDistribution {
    const dist: MemoryDistribution = { weak: 0, moderate: 0, strong: 0 };

    points.forEach(p => {
        if (p.stability < 7) dist.weak++;
        else if (p.stability < 30) dist.moderate++;
        else dist.strong++;
    });

    return dist;
}

/**
 * Calculates a "Memory Power" index (0-100).
 * Rule: Logarithmic scale of weighted stability.
 */
export function calculateMemoryPower(points: MemoryPoint[]): number {
    if (points.length === 0) return 0;
    const avgStability = points.reduce((sum, p) => sum + p.stability, 0) / points.length;
    // Map avg stability (0-365) to 0-100 scale roughly
    const power = Math.min(100, Math.log2(avgStability + 1) * 12);
    return Math.round(power);
}
