'use client';

import React from 'react';
import { clsx } from 'clsx';

interface MnemonicContentProps {
  content: string;
  className?: string;
}

/**
 * Renders WaniKani mnemonics with support for custom tags like <radical>, <kanji>, etc.
 */
export function MnemonicContent({ content, className }: MnemonicContentProps) {
  if (!content) return null;

  // Process the content to wrap WaniKani tags in styled spans
  // We use a simple regex replacement. For more complex needs, a proper parser would be better.
  const processedContent = content
    .replace(/<radical>([^<]+)<\/radical>/g, '<span class="text-sky-400 font-bold bg-sky-500/10 px-1 rounded">$1</span>')
    .replace(/<kanji>([^<]+)<\/kanji>/g, '<span class="text-rose-400 font-bold bg-rose-500/10 px-1 rounded">$1</span>')
    .replace(/<vocabulary>([^<]+)<\/vocabulary>/g, '<span class="text-fuchsia-400 font-bold bg-fuchsia-500/10 px-1 rounded">$1</span>')
    .replace(/<meaning>([^<]+)<\/meaning>/g, '<span class="text-amber-400 font-semibold">$1</span>')
    .replace(/<reading>([^<]+)<\/reading>/g, '<span class="text-slate-200 font-semibold">$1</span>');

  return (
    <div 
      className={clsx('mnemonic-container transition-all duration-300 leading-relaxed text-slate-300', className)}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
