"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type SrsState, stageToLearningState } from '@/types/srs';
import { CONTENT_TYPES, LEARNING_STATES, type ContentType, type LearningStatus } from '@/config/design.config';

interface ContentCardProps {
    type: 'KANJI' | 'VOCABULARY' | 'RADICAL' | 'GRAMMAR';
    character: string;
    reading?: string;
    meaning: string;
    level?: number;
    href: string;
    srsState?: SrsState;
    srsStage?: number;
    className?: string;
}

export function ContentCard({
    type,
    character,
    reading,
    meaning,
    level,
    href,
    srsState,
    srsStage = 0,
    className
}: ContentCardProps) {
    const normalizedType = (type?.toLowerCase() || 'vocabulary') as ContentType;
    const contentDesign = CONTENT_TYPES[normalizedType] || CONTENT_TYPES.vocabulary;
    const ContentIcon = contentDesign.icon;

    const learningState = (srsState as any as LearningStatus || stageToLearningState(srsStage));

    // MONO V4 HUE DENSITY LOGIC
    const isNew = learningState === 'new';
    const isLearning = learningState === 'learning';
    const isReview = learningState === 'review';
    const isRelearning = learningState === 'relearning';
    const isBurned = learningState === 'burned';

    const baseColor = isBurned ? '#64748b' : contentDesign.inkColor;

    // Treatments
    let cardBg = 'transparent';
    let textColor = baseColor;
    let borderColor = baseColor;
    let borderWidth = '2px';

    if (isNew) {
        cardBg = `${baseColor}05`;
        borderColor = `${baseColor}20`;
    } else if (isLearning) {
        cardBg = `${baseColor}15`;
        borderColor = baseColor;
    } else if (isReview) {
        cardBg = baseColor;
        textColor = '#ffffff';
        borderColor = baseColor;
    } else if (isRelearning) {
        cardBg = '#ffffff';
        borderColor = baseColor;
        borderWidth = '4px';
    } else if (isBurned) {
        cardBg = '#f1f5f9';
        textColor = '#475569';
        borderColor = '#cbd5e1';
    }

    return (
        <Link
            data-testid={type === 'VOCABULARY' ? 'vocab-card' : 'content-card'}
            href={href}
            className={cn(
                "group relative flex flex-col items-center justify-center p-6 min-h-[140px] rounded-2xl transition-all duration-300 active:scale-95 hover:scale-105 shadow-sm",
                className
            )}
            style={{
                backgroundColor: cardBg,
                borderColor: borderColor,
                borderWidth: borderWidth,
                borderStyle: 'solid',
                color: textColor
            }}
        >
            <div className="flex flex-col items-center text-center w-full gap-2">
                <span className={cn(
                    "font-jp font-black transition-colors",
                    type === 'VOCABULARY' ? "text-4xl" :
                        type === 'GRAMMAR' ? "text-2xl break-all" : "text-5xl"
                )}>
                    {character}
                </span>

                <div className="flex flex-col items-center gap-1">
                    {reading && (
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest leading-none",
                            isReview ? "text-white/80" : "opacity-70"
                        )}>
                            {reading}
                        </span>
                    )}

                    <span className={cn(
                        "text-xs font-bold uppercase tracking-tight leading-tight px-2",
                        isReview ? "text-white/90" : "opacity-80"
                    )}>
                        {meaning}
                    </span>
                </div>
            </div>

            {/* Content Type Icon (Subtle) */}
            <div
                className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ color: isReview ? 'white' : baseColor, opacity: 0.3 }}
            >
                <ContentIcon size={14} />
            </div>

            {level && (
                <span className={cn(
                    "absolute bottom-2 right-2 text-[9px] font-black uppercase tracking-widest",
                    isReview ? "text-white/20" : "opacity-20"
                )}>
                    LV.{level}
                </span>
            )}
        </Link>
    );
}
