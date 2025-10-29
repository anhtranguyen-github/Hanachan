import React from 'react';
import { CONTENT_TYPES, BRAND_COLORS } from '@/config/design.config';

interface TokenResult {
    surface: string;
    reading: string;
    pos: string;
    lemma?: string;
    dictionary?: any;
    conjugation?: string[];
}

interface TokenRendererProps {
    token: TokenResult;
    isSelected?: boolean;
    onClick?: (token: TokenResult) => void;
}

export function TokenRenderer({ token, isSelected, onClick }: TokenRendererProps) {
    // Map POS to Semantic Ink
    const getPosColor = (pos: string) => {
        switch (pos) {
            case 'noun': return CONTENT_TYPES.vocabulary.inkColor;
            case 'verb': return CONTENT_TYPES.kanji.inkColor;
            case 'adjective': return CONTENT_TYPES.grammar.inkColor;
            case 'particle': return '#94A3B8'; // Muted slate but not black
            default: return BRAND_COLORS.sakuraInk;
        }
    };

    const color = getPosColor(token.pos);

    return (
        <span
            className={`
                inline-block px-1 py-1 mx-0.5 rounded-lg cursor-pointer transition-all
                ${isSelected ? 'bg-white ring-2 ring-purple-500 -translate-y-1' : 'hover:bg-sakura-cocoa/5'}
            `}
            onClick={() => onClick?.(token)}
            title={`${token.reading} (${token.pos})`}
        >
            <ruby className="ruby-text select-none font-bold" style={{ color: isSelected ? BRAND_COLORS.sakuraInk : color }}>
                {token.surface}
                <rt className="text-[10px] font-black select-none opacity-40 uppercase tracking-tighter" style={{ color: color }}>
                    {token.reading !== token.surface ? token.reading : ''}
                </rt>
            </ruby>
        </span>
    );
}
