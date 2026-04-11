'use client';

import React from 'react';
import { clsx } from 'clsx';

interface MnemonicContentProps {
  content: string;
  className?: string;
}

/**
 * Renders WaniKani mnemonics with support for custom tags like <radical>, <kanji>, etc.
 * Uses dangerouslySetInnerHTML carefully for the tagged content.
 */
export function MnemonicContent({ content, className }: MnemonicContentProps) {
  if (!content) return null;

  return (
    <div 
      className={clsx('mnemonic-container transition-all duration-300', className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
