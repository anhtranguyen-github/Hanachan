"use client";

import React, { useEffect, useRef } from 'react';
import * as wanakana from 'wanakana';
import { cn } from '@/lib/utils';

interface JapaneseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onEnter?: (value: string) => void;
    mode?: 'to-hiragana' | 'to-katakana' | 'none';
}

export function JapaneseInput({
    onEnter,
    mode = 'to-hiragana',
    className,
    ...props
}: JapaneseInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const el = inputRef.current;
        if (!el || mode === 'none') return;

        // Bind wanakana to the input element
        if (mode === 'to-hiragana') {
            wanakana.bind(el, { IMEMode: true });
        } else if (mode === 'to-katakana') {
            wanakana.bind(el, { IMEMode: true, useObsoleteKana: false });
        }

        return () => {
            wanakana.unbind(el);
        };
    }, [mode]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onEnter) {
            onEnter(e.currentTarget.value);
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            className={cn(
                "w-full bg-white border-2 border-sakura-divider rounded-2xl px-6 py-4 text-center text-xl font-bold focus:outline-none focus:border-sakura-accent-primary transition-all placeholder:text-sakura-text-muted/30",
                className
            )}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            onKeyDown={handleKeyDown}
            {...props}
        />
    );
}
