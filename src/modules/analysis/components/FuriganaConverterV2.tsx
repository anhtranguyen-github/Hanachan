'use client';

import React, { useEffect, useState } from 'react';
import type { TokenResult } from '@/types/ai.types';
import { TokenRenderer } from './TokenRenderer';
import { Loader2 } from 'lucide-react';

interface FuriganaConverterV2Props {
    text: string;
    onTokenClick?: (token: TokenResult) => void;
    showFurigana?: boolean;
}

// Mock analyzer service locally
const mockAnalyze = async (text: string) => {
    // Return a single token for the entire text as a fallback
    return {
        tokens: [{
            surface: text,
            reading: '',
            meaning: 'Mock Analysis',
            pos: 'unknown',
            baseForm: text
        }]
    };
};

export function FuriganaConverterV2({ text, onTokenClick, showFurigana = true }: FuriganaConverterV2Props) {
    const [tokens, setTokens] = useState<TokenResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!text) {
            setTokens([]);
            return;
        }

        const analyze = async () => {
            setIsLoading(true);
            try {
                const result = await mockAnalyze(text);
                setTokens(result.tokens);
            } catch (error) {
                console.error('Failed to analyze subtitle text:', error);
            } finally {
                setIsLoading(false);
            }
        };

        analyze();
    }, [text]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-sakura-accent-primary" size={24} />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-end justify-center gap-y-2 leading-relaxed text-center">
            {tokens.map((token, index) => (
                <TokenRenderer
                    key={`${index}-${token.surface}`}
                    token={token}
                    onClick={onTokenClick}
                />
            ))}
        </div>
    );
}
