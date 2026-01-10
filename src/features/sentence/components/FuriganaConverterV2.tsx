
import React from 'react';

export function FuriganaConverterV2({ text, onTokenClick }: { text: string, onTokenClick?: any }) {
    return <span onClick={() => onTokenClick?.({ surface: text })}>{text}</span>;
}
