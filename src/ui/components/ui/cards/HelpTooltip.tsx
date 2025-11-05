'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * HelpTooltip - (?) icon with hover tooltip for explaining SRS concepts.
 */

export interface HelpTooltipProps {
    content: string;
    className?: string;
    iconSize?: number;
}

export function HelpTooltip({
    content,
    className,
    iconSize = 14,
}: HelpTooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
        <span
            className={cn('relative inline-flex items-center', className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            tabIndex={0}
            role="button"
            aria-label="Help"
        >
            <Info
                size={iconSize}
                className="text-foreground/40 hover:text-foreground/60 cursor-help transition-colors"
            />

            {/* Tooltip */}
            {isVisible && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 pointer-events-none"
                    role="tooltip"
                >
                    <div className="bg-foreground text-background text-xs font-medium px-3 py-2 rounded-lg ">
                        {content}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-foreground" />
                        </div>
                    </div>
                </div>
            )}
        </span>
    );
}

/**
 * SRS Glossary - Pre-defined tooltips for SRS concepts
 */
export const SRS_GLOSSARY = {
    lessons: 'New items to learn. Complete lessons to add items to your review queue.',
    reviews: 'Practice items you\'ve already learned to strengthen memory using spaced repetition.',
    ghost_reviews: 'Extra reviews for items you\'ve failed 3+ times in a row. Helps reinforce difficult items.',
    critical_items: 'Overdue items that need urgent attention (2+ days late).',
    apprentice: 'Items you\'re still learning. Review frequently (4h → 8h → 1d → 2d).',
    guru: 'Items you know fairly well. Review weekly (1w → 2w).',
    master: 'Items you\'ve mastered. Review monthly.',
    enlightened: 'Almost permanent memory. Review after 4 months.',
    burned: 'Permanently learned! No more reviews needed. 🔥',
    srs_stage: 'Spaced Repetition System level. Higher stage = longer intervals between reviews.',
    level_up: 'Unlock new content by Guru-ing 90% of current level\'s Kanji.',
    jlpt: 'Japanese-Language Proficiency Test. Levels: N5 (easiest) to N1 (hardest).',
    spread: 'Distribution of your items across SRS stages. Shows how many items at each level.',
    accuracy: 'Percentage of reviews answered correctly. Higher is better!',
    forecast: 'Predicted number of reviews coming up. Helps you plan your study sessions.',
} as const;

export type GlossaryKey = keyof typeof SRS_GLOSSARY;

/**
 * GlossaryTooltip - Convenience component for common SRS terms
 */
export function GlossaryTooltip({
    term,
    className,
}: {
    term: GlossaryKey;
    className?: string;
}) {
    return (
        <HelpTooltip
            content={SRS_GLOSSARY[term]}
            className={className}
        />
    );
}

export default HelpTooltip;
