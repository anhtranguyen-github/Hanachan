'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CONTENT_TYPES, LEARNING_STATES, type ContentType, type LearningStatus } from '@/config/design.config';
import { KUBadge } from './KUBadge';

interface KUCardProps {
    id: string;
    contentType: ContentType;
    learningState?: LearningStatus;
    character: string;
    meaning?: string;
    reading?: string;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export function KUCard({
    id,
    contentType,
    learningState,
    character,
    meaning,
    reading,
    href,
    onClick,
    className
}: KUCardProps) {
    const contentDesign = CONTENT_TYPES[contentType];
    const stateDesign = learningState ? LEARNING_STATES[learningState] : null;

    const content = (
        <div
            className={cn(
                "group p-4 rounded-3xl border transition-all hover:-translate-y-1 bg-white/80 backdrop-blur-sm cursor-pointer",
                "ring-1 ring-inset",
                className
            )}
            style={{
                borderColor: stateDesign?.shellColor || 'var(--color-sakura-divider)',
                boxShadow: stateDesign ? `0 0 0 1px ${stateDesign.shellColor} inset` : 'none'
            }}
            onClick={onClick}
        >
            <div className="flex flex-col items-center gap-3">
                <KUBadge
                    contentType={contentType}
                    learningState={learningState}
                    character={character}
                    size="md"
                />

                <div className="flex flex-col items-center gap-1">
                    {reading && (
                        <div className="text-sm font-black uppercase tracking-widest" style={{ color: contentDesign.inkColor }}>
                            {reading}
                        </div>
                    )}

                    {meaning && (
                        <div className="text-xs font-medium text-center text-sakura-ink/70">
                            {meaning}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
