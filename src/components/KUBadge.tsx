'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CONTENT_TYPES, LEARNING_STATES, type ContentType, type LearningStatus } from '@/config/design.config';

interface KUBadgeProps {
    contentType: ContentType;
    learningState?: LearningStatus;
    character: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showState?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-28 h-28 text-6xl'
};

export function KUBadge({
    contentType,
    learningState,
    character,
    size = 'md',
    showState = true,
    className
}: KUBadgeProps) {
    const normalizedType = (contentType?.toLowerCase() || 'vocabulary') as ContentType;
    const contentDesign = CONTENT_TYPES[normalizedType] || CONTENT_TYPES.vocabulary;
    const normalizedState = (learningState?.toLowerCase() || 'new') as LearningStatus;

    // MONO V4 HUE DENSITY LOGIC
    const isNew = normalizedState === 'new';
    const isLearning = normalizedState === 'learning';
    const isReview = normalizedState === 'review';
    const isRelearning = normalizedState === 'relearning';
    const isBurned = normalizedState === 'burned';

    const baseColor = isBurned ? '#64748b' : contentDesign.inkColor;

    // Treatments
    let bgColor = 'transparent';
    let textColor = baseColor;
    let borderColor = baseColor;
    let borderWidth = '2px';

    if (isNew) {
        bgColor = `${baseColor}10`;
        borderColor = `${baseColor}20`;
    } else if (isLearning) {
        bgColor = `${baseColor}25`;
        borderColor = baseColor;
    } else if (isReview) {
        bgColor = baseColor;
        textColor = '#ffffff';
        borderColor = baseColor;
    } else if (isRelearning) {
        bgColor = '#ffffff';
        borderColor = baseColor;
        borderWidth = '4px';
    } else if (isBurned) {
        bgColor = '#f1f5f9';
        textColor = '#475569';
        borderColor = '#cbd5e1';
    }

    return (
        <div className={cn("relative inline-flex", className)}>
            <div
                className={cn(
                    "rounded-2xl flex items-center justify-center font-black font-jp transition-all",
                    sizeClasses[size]
                )}
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    borderStyle: 'solid'
                }}
            >
                {character}
            </div>
        </div>
    );
}
