
import React from 'react';
import { clsx } from 'clsx';

interface RichTextRendererProps {
    content: string | any[];
    className?: string;
}

/**
 * RichTextRenderer
 * 
 * Handles two types of content:
 * 1. HTML Strings (Legacy HTML style with <mark> tags)
 * 2. Structured Token Arrays (Vocab/Grammar style)
 */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
    // Case 1: Structured Token Array (Vocab style)
    if (Array.isArray(content)) {
        return (
            <div className={clsx("flex flex-wrap items-baseline gap-x-1 gap-y-2 leading-relaxed", className)}>
                {content.map((token: any, idx: number) => {
                    const type = token.type;
                    const text = token.content;

                    if (typeof text === 'string') {
                        return <span key={idx} className={getHighlightClass(type)}>{text}</span>;
                    }

                    // Handle nested content if it's an array
                    if (Array.isArray(text)) {
                        return <RichTextRenderer key={idx} content={text} />;
                    }

                    return <span key={idx}>{text}</span>;
                })}
            </div>
        );
    }

    // Case 2: HTML String (Kanji style)
    if (typeof content !== 'string') {
        return <span className="text-primary-dark/20 italic">No content available</span>;
    }

    return (
        <div
            className={clsx("hanachan-rich-text leading-relaxed", className)}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}

function getHighlightClass(type: string) {
    switch (type) {
        case 'kanji':
            return 'bg-[#ff00aa]/10 text-[#ff00aa] font-black px-1.5 rounded-sm border-b-2 border-[#ff00aa]/30 mx-0.5';
        case 'radical':
            return 'bg-[#00aaff]/10 text-[#00aaff] font-black px-1.5 rounded-sm border-b-2 border-[#00aaff]/30 mx-0.5';
        case 'vocabulary':
            return 'bg-[#aa00ff]/10 text-[#aa00ff] font-black px-1.5 rounded-sm border-b-2 border-[#aa00ff]/30 mx-0.5';
        case 'reading':
            return 'bg-primary-dark text-white font-black px-2 rounded-sm mx-0.5 shadow-sm';
        case 'grammar_point':
            return 'text-primary font-black border-b-2 border-primary/30 mx-0.5';
        case 'japanese':
            return 'font-black text-primary';
        default:
            return '';
    }
}
