import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentenceAnnotation {
    ku_id: string;
    ku_type: string;       // 'kanji' | 'vocabulary' | 'grammar'
    character: string;
    slug?: string;
    position_start: number;
    position_end: number;
}

interface AnnotatedSentenceProps {
    /** The raw Japanese text */
    text: string;
    /** Annotations from sentence_knowledge joined with knowledge_units */
    annotations?: SentenceAnnotation[];
    /** Text size class */
    className?: string;
    /** Whether to make annotations clickable (links to KU detail pages) */
    clickable?: boolean;
}

// ---------------------------------------------------------------------------
// Color map by KU type
// ---------------------------------------------------------------------------

const typeStyles: Record<string, { text: string; bg: string; border: string; href: string }> = {
    kanji: {
        text: 'text-[#D88C9A]',
        bg: 'bg-[#F4ACB7]/10',
        border: 'border-[#F4ACB7]/30',
        href: '/content/kanji',
    },
    vocabulary: {
        text: 'text-[#9B7DB5]',
        bg: 'bg-[#CDB4DB]/10',
        border: 'border-[#CDB4DB]/30',
        href: '/content/vocabulary',
    },
    grammar: {
        text: 'text-[#5A9E72]',
        bg: 'bg-[#B7E4C7]/10',
        border: 'border-[#B7E4C7]/30',
        href: '/content/grammar',
    },
    radical: {
        text: 'text-[#3A6EA5]',
        bg: 'bg-[#A2D2FF]/10',
        border: 'border-[#A2D2FF]/30',
        href: '/content/radicals',
    },
};

const defaultStyle = { text: '', bg: '', border: '', href: '' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AnnotatedSentence
 *
 * Renders a Japanese sentence with highlighted, clickable spans for
 * matched vocabulary, kanji, and grammar. No dangerouslySetInnerHTML.
 *
 * Unmatched characters render as plain text.
 */
export function AnnotatedSentence({
    text,
    annotations = [],
    className,
    clickable = true,
}: AnnotatedSentenceProps) {
    if (!text) return null;

    // No annotations → plain text
    if (annotations.length === 0) {
        return <span className={clsx('jp-text', className)}>{text}</span>;
    }

    // Sort annotations by position_start
    const sorted = [...annotations].sort((a, b) => a.position_start - b.position_start);

    // Build segments: interleave plain text with annotated spans
    const segments: React.ReactNode[] = [];
    let cursor = 0;

    for (const ann of sorted) {
        // Safety: skip if out of bounds or overlapping
        if (ann.position_start < cursor || ann.position_end > text.length) continue;

        // Plain text before this annotation
        if (ann.position_start > cursor) {
            segments.push(
                <span key={`plain-${cursor}`} className="jp-text">
                    {text.slice(cursor, ann.position_start)}
                </span>
            );
        }

        // Annotated span
        const style = typeStyles[ann.ku_type] || defaultStyle;
        const annotatedText = text.slice(ann.position_start, ann.position_end);
        const slug = ann.slug || `${ann.ku_type}_${ann.character}`;

        if (clickable && style.href) {
            segments.push(
                <Link
                    key={`ann-${ann.position_start}`}
                    href={`${style.href}/${encodeURIComponent(slug)}`}
                    className={clsx(
                        'jp-text font-black px-0.5 rounded-sm border-b-2 transition-all',
                        'hover:opacity-80 cursor-pointer',
                        style.text, style.border,
                    )}
                    title={`${ann.ku_type}: ${ann.character}`}
                >
                    {annotatedText}
                </Link>
            );
        } else {
            segments.push(
                <span
                    key={`ann-${ann.position_start}`}
                    className={clsx(
                        'jp-text font-black px-0.5 rounded-sm border-b-2',
                        style.text, style.border,
                    )}
                    title={`${ann.ku_type}: ${ann.character}`}
                >
                    {annotatedText}
                </span>
            );
        }

        cursor = ann.position_end;
    }

    // Remaining plain text after the last annotation
    if (cursor < text.length) {
        segments.push(
            <span key={`plain-${cursor}`} className="jp-text">
                {text.slice(cursor)}
            </span>
        );
    }

    return (
        <span className={clsx('inline', className)}>
            {segments}
        </span>
    );
}
