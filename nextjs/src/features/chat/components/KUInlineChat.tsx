'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Loader2, Mic, Volume2, VolumeX, Sparkles, X, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@/features/auth/AuthContext';
import { useChatSession } from '../hooks/useChatSession';
import { VoiceRecorder } from '@/components/shared/VoiceRecorder';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KUInlineChatProps {
    /** The KU ID this chat is contextualized for */
    kuId: string;
    /** KU type: radical, kanji, vocabulary, grammar */
    kuType: string;
    /** The main character (e.g. 食, 食べる) */
    character: string;
    /** Primary English meaning */
    meaning: string;
    /** Optional: extra context like readings */
    extraContext?: string;
}

// ─── Markdown Components ──────────────────────────────────────────────────────

const markdownComponents = {
    p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }: any) => <strong className="font-black text-foreground">{children}</strong>,
    em: ({ children }: any) => <em className="text-primary-dark">{children}</em>,
    code: ({ children, className }: any) => {
        const isInline = !className;
        return isInline
            ? <code className="px-1.5 py-0.5 bg-primary/8 text-primary-dark rounded-md text-[13px] font-mono font-bold border border-primary/10">{children}</code>
            : <code className={clsx("block p-3 bg-gray-50 rounded-xl text-sm font-mono overflow-x-auto border border-border", className)}>{children}</code>;
    },
    ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
    li: ({ children }: any) => <li className="text-sm leading-relaxed">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-lg font-black mt-3 mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-black mt-3 mb-1.5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-black mt-2 mb-1 uppercase tracking-wider">{children}</h3>,
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-3 border-primary/30 pl-3 py-1 my-2 bg-primary/5 rounded-r-xl text-sm italic">
            {children}
        </blockquote>
    ),
    table: ({ children }: any) => (
        <div className="overflow-x-auto my-2">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">{children}</table>
        </div>
    ),
    th: ({ children }: any) => <th className="px-3 py-2 bg-gray-50 text-left font-black text-[10px] uppercase tracking-widest text-foreground/50 border-b border-border">{children}</th>,
    td: ({ children }: any) => <td className="px-3 py-2 border-b border-border/30">{children}</td>,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function KUInlineChat({ kuId, kuType, character, meaning, extraContext }: KUInlineChatProps) {
    const { user } = useUser();
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        messages: hookMessages,
        streaming,
        sendMessageStreaming,
        stopStream,
        createNewConversation,
    } = useChatSession(user?.id);

    // Auto-scroll on new messages
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [hookMessages, streaming.isStreaming, streaming.partial, isOpen]);

    // Focus the input when the panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    // Build the context prefix for the first message
    const buildContextPrefix = useCallback((msg: string) => {
        const ctx = `[Context: User is viewing the ${kuType} "${character}" (${meaning})${extraContext ? `. ${extraContext}` : ''}. Answer their question about this item.]\n\n`;
        return hookMessages.length === 0 ? ctx + msg : msg;
    }, [kuType, character, meaning, extraContext, hookMessages.length]);

    const handleSend = async () => {
        if (!input.trim() || streaming.isStreaming) return;
        const content = buildContextPrefix(input);
        setInput('');
        await sendMessageStreaming(content, ttsEnabled);
    };

    const handleVoiceTranscript = useCallback(async (text: string) => {
        if (!text.trim() || streaming.isStreaming) return;
        const content = buildContextPrefix(text);
        await sendMessageStreaming(content, ttsEnabled);
    }, [streaming.isStreaming, buildContextPrefix, sendMessageStreaming, ttsEnabled]);

    const isTyping = streaming.isStreaming;
    const streamingContent = streaming.partial;

    // Type color mapping
    const typeColors: Record<string, { accent: string; bg: string; border: string }> = {
        radical: { accent: '#3A6EA5', bg: 'bg-[#A2D2FF]/10', border: 'border-[#A2D2FF]/30' },
        kanji: { accent: '#D88C9A', bg: 'bg-[#F4ACB7]/10', border: 'border-[#F4ACB7]/30' },
        vocabulary: { accent: '#9B7DB5', bg: 'bg-[#CDB4DB]/10', border: 'border-[#CDB4DB]/30' },
        grammar: { accent: '#5A9E72', bg: 'bg-[#B7E4C7]/10', border: 'border-[#B7E4C7]/30' },
    };
    const colors = typeColors[kuType] || typeColors.kanji;

    // ── Collapsed FAB ─────────────────────────────────────────────────────────
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={clsx(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95",
                    "bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A]"
                )}
                title="Chat with Hanachan about this item"
            >
                <MessageCircle size={22} />
            </button>
        );
    }

    // ── Open Chat Panel ───────────────────────────────────────────────────────
    return (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] flex flex-col bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header */}
            <header className={clsx("px-4 py-3 flex items-center justify-between shrink-0 border-b", colors.border, colors.bg)}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white text-sm font-black shadow-sm">
                        花
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest truncate">
                            Ask about <span className="jp-text" style={{ color: colors.accent }}>{character}</span>
                        </h3>
                        <p className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">{meaning}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* TTS Toggle */}
                    <button
                        onClick={() => setTtsEnabled(v => !v)}
                        title={ttsEnabled ? 'Disable voice response' : 'Enable voice response'}
                        className={clsx(
                            "p-1.5 rounded-lg transition-all text-xs",
                            ttsEnabled
                                ? "bg-primary/15 text-primary"
                                : "text-foreground/20 hover:text-foreground/50 hover:bg-border/20"
                        )}
                    >
                        {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                    {/* Close */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-border/20 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {hookMessages.length === 0 && !isTyping && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <Sparkles size={28} className="text-primary/30 mb-3" />
                        <p className="text-sm font-bold text-foreground/40 leading-relaxed max-w-[260px]">
                            Ask anything about <span className="jp-text font-black" style={{ color: colors.accent }}>{character}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-4 justify-center max-w-xs">
                            {kuType === 'kanji' && [
                                `How do I remember ${character}?`,
                                `Common words with ${character}`,
                                `Explain the readings`,
                            ].map(s => (
                                <button key={s} onClick={() => setInput(s)} className="px-2.5 py-1.5 bg-[#F7FAFC] border border-border/40 rounded-xl text-[9px] font-bold text-foreground/40 hover:text-foreground/70 hover:border-primary/30 transition-all">
                                    {s}
                                </button>
                            ))}
                            {kuType === 'vocabulary' && [
                                `Example sentences with ${character}`,
                                `How is this different from similar words?`,
                                `Explain the kanji in ${character}`,
                            ].map(s => (
                                <button key={s} onClick={() => setInput(s)} className="px-2.5 py-1.5 bg-[#F7FAFC] border border-border/40 rounded-xl text-[9px] font-bold text-foreground/40 hover:text-foreground/70 hover:border-primary/30 transition-all">
                                    {s}
                                </button>
                            ))}
                            {kuType === 'grammar' && [
                                `Give me examples of ${character}`,
                                `When do I use this pattern?`,
                                `Compare with similar grammar`,
                            ].map(s => (
                                <button key={s} onClick={() => setInput(s)} className="px-2.5 py-1.5 bg-[#F7FAFC] border border-border/40 rounded-xl text-[9px] font-bold text-foreground/40 hover:text-foreground/70 hover:border-primary/30 transition-all">
                                    {s}
                                </button>
                            ))}
                            {kuType === 'radical' && [
                                `What kanji use this radical?`,
                                `Help me remember ${meaning}`,
                            ].map(s => (
                                <button key={s} onClick={() => setInput(s)} className="px-2.5 py-1.5 bg-[#F7FAFC] border border-border/40 rounded-xl text-[9px] font-bold text-foreground/40 hover:text-foreground/70 hover:border-primary/30 transition-all">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {hookMessages.map((m, i) => (
                    <div
                        key={`${i}-${m.timestamp}`}
                        className={clsx(
                            'flex gap-2 animate-in fade-in duration-300',
                            m.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {m.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-lg bg-[#FFF5F5] border border-[#FFDADA] text-[#FFB5B5] flex items-center justify-center shrink-0 mt-1">
                                <Bot size={11} />
                            </div>
                        )}
                        <div className={clsx(
                            'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm',
                            m.role === 'user'
                                ? 'bg-foreground text-white rounded-tr-sm'
                                : 'bg-[#F7FAFC] text-foreground border border-border/50 rounded-tl-sm'
                        )}>
                            {m.role === 'assistant' ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {m.content}
                                </ReactMarkdown>
                            ) : (
                                <span className="whitespace-pre-wrap">{m.content.replace(/^\[Context:[\s\S]*?\]\n\n/, '')}</span>
                            )}
                        </div>
                        {m.role === 'user' && (
                            <div className="w-6 h-6 rounded-lg bg-[#F7FAFC] border border-border text-foreground/30 flex items-center justify-center shrink-0 mt-1">
                                <User size={11} />
                            </div>
                        )}
                    </div>
                ))}

                {/* Streaming */}
                {isTyping && (
                    <div className="flex gap-2 justify-start animate-in fade-in duration-300">
                        <div className="w-6 h-6 rounded-lg bg-[#FFF5F5] border border-[#FFDADA] text-[#FFB5B5] flex items-center justify-center shrink-0 mt-1">
                            <Bot size={11} />
                        </div>
                        {streamingContent ? (
                            <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-[#F7FAFC] text-foreground border border-border/50 text-[13px] leading-relaxed font-medium shadow-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {streamingContent}
                                </ReactMarkdown>
                                <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm ml-0.5 animate-pulse align-middle" />
                            </div>
                        ) : (
                            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#F7FAFC] border border-border/50 flex gap-1.5 shadow-sm">
                                <div className="w-1.5 h-1.5 bg-[#FFB5B5]/60 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-[#FFB5B5]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-[#FFB5B5]/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <VoiceRecorder
                        disabled={isTyping}
                        onTranscript={handleVoiceTranscript}
                        className="!w-9 !h-9"
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        disabled={isTyping}
                        className="flex-1 py-2.5 px-4 bg-[#F7FAFC] border border-border/40 rounded-2xl text-sm font-medium outline-none focus:border-primary/40 focus:bg-white transition-all placeholder:text-foreground/20"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="w-9 h-9 rounded-xl bg-foreground disabled:bg-[#CBD5E0] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
