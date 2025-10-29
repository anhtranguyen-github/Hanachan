import React from 'react';
import { cn } from '@/lib/utils';
import { LEARNING_STATES, CONTENT_TYPES, type LearningStatus, type ContentType } from '@/config/design.config';

interface SRSStatusBadgeProps {
    state?: LearningStatus | string | null;
    stage?: number;
    contentType?: ContentType | string;
    className?: string;
}

export function SRSStatusBadge({ state, stage = 0, contentType, className }: SRSStatusBadgeProps) {
    const normalizedState = (state?.toLowerCase() || 'new') as LearningStatus;
    const design = LEARNING_STATES[normalizedState] || LEARNING_STATES.new;

    // MONO V4 DENSITY LOGIC
    const isNew = normalizedState === 'new';
    const isLearning = normalizedState === 'learning';
    const isReview = normalizedState === 'review';
    const isRelearning = normalizedState === 'relearning';
    const isBurned = normalizedState === 'burned';

    const baseColor = isBurned ? '#64748b' : '#4A3728'; // Default to Cocoa if no content type
    let finalColor = baseColor;

    if (contentType) {
        const typeKey = contentType.toLowerCase() as ContentType;
        const typeDesign = CONTENT_TYPES[typeKey];
        if (typeDesign) {
            finalColor = isBurned ? '#64748b' : typeDesign.inkColor;
        }
    }

    // Treatments
    let bgColor = 'transparent';
    let borderColor = finalColor;
    let borderWidth = '2px';

    if (isNew) {
        bgColor = `${finalColor}10`;
        borderColor = `${finalColor}20`;
    } else if (isLearning) {
        bgColor = `${finalColor}30`;
    } else if (isReview) {
        bgColor = finalColor;
        borderColor = finalColor;
    } else if (isRelearning) {
        bgColor = '#ffffff';
        borderWidth = '3px';
    } else if (isBurned) {
        bgColor = '#cbd5e1';
        borderColor = '#94a3b8';
    }

    return (
        <div
            className={cn("w-3 h-3 rounded-full transition-all", className)}
            style={{
                backgroundColor: bgColor,
                border: `${borderWidth} solid ${borderColor}`,
            }}
            title={design.label}
        />
    );
}

