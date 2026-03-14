/* eslint-disable react/no-unescaped-entities */
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Bot, User, Plus, MessageSquare, Menu, Loader2,
    ChevronLeft, Eye, Square, Pencil, Check, X, Trash2,
    Clock, MoreHorizontal, Mic
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';
import { QuickViewModal, QuickViewData } from '@/components/shared/QuickViewModal';
import { mapUnitToQuickView } from '@/features/knowledge/ui-mapper';
import { getKnowledgeUnit } from '@/features/knowledge/actions';
import { HanaTime } from '@/lib/time';
import { useChatSession } from '@/features/chat/hooks/useChatSession';
import { VoiceRecorder } from '@/components/shared/VoiceRecorder';
import { AgentSession } from '@/types/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolsUsed?: string[];
    referencedUnits?: { id: string; slug: string; character: string; type: string }[];
    /** True when the message was sent via voice recording */
    isVoice?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Thread Item Component ────────────────────────────────────────────────────

function ThreadItem({
    session,
    isActive,
    onSelect,
    onRename,
    onDelete,
}: {
    session: AgentSession;
    isActive: boolean;
    onSelect: () => void;
    onRename: (title: string) => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(session.title || 'Untitled Thread');
    const [showMenu, setShowMenu] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRenameSubmit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== (session.title || 'Untitled Thread')) {
            onRename(trimmed);
        }
        setIsEditing(false);
    };

    const title = session.title || 'Untitled Thread';
    const subtitle = session.summary
        ? session.summary.slice(0, 60) + (session.summary.length > 60 ? '…' : '')
        : `${session.message_count} message${session.message_count !== 1 ? 's' : ''}`;

    return (
        <div
            className={clsx(
                'group relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                isActive
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-[#F7FAFC] border border-transparent'
            )}
            onClick={() => !isEditing && onSelect()}
        >
            <div className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                isActive ? 'bg-primary/15 text-primary' : 'bg-[#F0E0E0]/60 text-[#CBD5E0]'
            )}>
                <MessageSquare size={13} />
            </div>

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                            ref={inputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') { setIsEditing(false); setEditValue(title); }
                            }}
                            className="flex-1 text-[11px] font-bold bg-white border border-primary/30 rounded-lg px-2 py-1 outline-none text-[#3E4A61]"
                        />
                        <button onClick={handleRenameSubmit} className="p-1 text-[#48BB78] hover:bg-[#48BB78]/10 rounded-md">
                            <Check size={11} />
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditValue(title); }} className="p-1 text-foreground/30 hover:bg-border/20 rounded-md">
                            <X size={11} />
                        </button>
                    </div>
                ) : (
                    <p className={clsx(
                        'text-[11px] font-bold truncate leading-tight',
                        isActive ? 'text-primary' : 'text-[#3E4A61]'
                    )}>
                        {title}
                    </p>
                )}
                {!isEditing && (
                    <>
                        <p className="text-[9px] text-foreground/30 font-medium truncate mt-0.5 leading-tight">{subtitle}</p>
                        <p className="text-[8px] text-foreground/20 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Clock size={8} />
                            {formatRelativeTime(session.updated_at)}
                        </p>
                    </>
                )}
            </div>

            {/* Context menu */}
            {!isEditing && (
                <div ref={menuRef} className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowMenu(v => !v)}
                        className={clsx(
                            'p-1 rounded-lg transition-all',
                            showMenu
                                ? 'bg-border/30 text-foreground/60'
                                : 'opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-foreground/60 hover:bg-border/20'
                        )}
                    >
                        <MoreHorizontal size={12} />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                            <button
                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:bg-[#F7FAFC] transition-colors"
                            >
                                <Pencil size={10} /> Rename
                            </button>
                            <button
                                onClick={() => { onDelete(); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={10} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

import { useChat } from '@/features/chat/context/ChatContext';

// ... (keep types and formatRelativeTime helper if needed, or remove if unused)

export default function ChatbotPage() {
    const { user, openLoginModal } = useUser();
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Track which message indices were sent via voice
    const voiceMessageIndicesRef = useRef<Set<number>>(new Set());

    // Use the shared chat context
    const {
        messages: rawMessages,
        streaming,
        sessionTitle,
        sendMessageStreaming,
        stopStream,
        loadThreadHistory,
    } = useChat();

    // Convert to local Message type with voice tracking
    const messages: Message[] = rawMessages.map((m, i) => ({
        id: `${i}-${m.timestamp}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp || HanaTime.getNowISO(),
        isVoice: voiceMessageIndicesRef.current.has(i),
    }));

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<QuickViewData | null>(null);
    const [isLoadingUnit, setIsLoadingUnit] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streaming.isStreaming, mounted]);

    const handleSend = async (isVoice = false) => {
        if (!input.trim() || streaming.isStreaming) return;
        const content = input;
        setInput('');

        if (isVoice) {
            voiceMessageIndicesRef.current.add(rawMessages.length);
        }
        await sendMessageStreaming(content);
    };

    const handleVoiceTranscript = useCallback(async (text: string) => {
        if (!text.trim() || streaming.isStreaming) return;
        voiceMessageIndicesRef.current.add(rawMessages.length);
        await sendMessageStreaming(text);
    }, [streaming.isStreaming, rawMessages.length, sendMessageStreaming]);

    const handleViewUnit = async (unit: { id: string; slug: string; type: string }) => {
        setIsLoadingUnit(true);
        try {
            const fullUnit = await getKnowledgeUnit(unit.type, unit.slug);
            if (fullUnit) {
                setModalData(mapUnitToQuickView(fullUnit as any));
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error('Failed to load unit details:', err);
        } finally {
            setIsLoadingUnit(false);
        }
    };

    if (!mounted) return null;

    const isTyping = streaming.isStreaming;
    const streamingContent = streaming.partial;
    const isEmptyState = messages.length === 0 && !isTyping;

    return (
        <div className="flex flex-col h-full relative bg-white min-w-0">
            {/* Header / Title Bar */}
            <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="min-w-0">
                        <h2 className="text-xs font-black text-foreground tracking-widest uppercase truncate">
                            {sessionTitle || 'New Conversation'}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isTyping && (
                        <button
                            onClick={stopStream}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm"
                        >
                            <Square size={9} fill="currentColor" />
                            Stop
                        </button>
                    )}
                </div>
            </header>

            {/* Messages Area */}
            <div className={clsx(
                "flex-1 overflow-y-auto custom-scrollbar",
                isEmptyState ? "flex items-center justify-center" : "p-4 lg:p-8 space-y-6"
            )}>
                {isEmptyState ? (
                    // Empty State - Perfectly Centered
                    <div className="flex flex-col items-center justify-center text-center px-4 py-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                                花
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-[#3E4A61] mb-2 tracking-tight">Konnichiwa!</h3>
                        <p className="text-sm text-foreground/40 font-medium max-w-sm leading-relaxed mb-10">
                            I'm Hanachan, your Japanese language tutor. How can I help you today?
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
                            {[
                                'Explain the grammar for 〜ほうがいい',
                                'What is the reading for 読書?',
                                'Practice a basic self-introduction',
                                'Explain JLPT N3 listening tips',
                            ].map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => { setInput(suggestion); }}
                                    className="p-4 bg-white border border-[#F0E0E0] hover:border-primary/40 hover:bg-primary/5 rounded-2xl text-[11px] font-bold text-foreground/60 hover:text-primary text-left transition-all group relative overflow-hidden"
                                >
                                    {suggestion}
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Messages List
                    <>
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={clsx(
                                    'flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500',
                                    m.role === 'user' ? 'items-end ml-auto max-w-[85%] lg:max-w-[70%]' : 'items-start max-w-[85%] lg:max-w-[70%]'
                                )}
                            >
                                <div className={clsx(
                                    'flex items-center gap-2 px-1',
                                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}>
                                    <div className={clsx(
                                        'w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm transition-all duration-300',
                                        m.role === 'user'
                                            ? 'bg-white border-[#F0E0E0] text-[#A0AEC0]'
                                            : 'bg-[#FFF5F5] border-[#FFDADA] text-[#FFB5B5]'
                                    )}>
                                        {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-[#CBD5E0] tracking-[0.2em]">
                                        {m.role === 'user' ? 'YOU' : 'HANACHAN'}
                                        {m.isVoice && (
                                            <span className="ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[8px] font-black tracking-widest normal-case border border-primary/20">
                                                <Mic size={8} />
                                                VOICE
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className={clsx(
                                    'px-5 py-4 rounded-[28px] text-sm font-medium leading-relaxed shadow-sm transition-all relative overflow-hidden',
                                    m.role === 'user'
                                        ? 'bg-[#3E4A61] text-white rounded-tr-none'
                                        : 'bg-[#F7FAFC] text-foreground border border-[#EDF2F7] rounded-tl-none'
                                )}>
                                    <div className="whitespace-pre-wrap">{m.content}</div>

                                    {m.referencedUnits && m.referencedUnits.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/5">
                                            <h4 className="w-full text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Deep Dive</h4>
                                            {m.referencedUnits.map(ku => (
                                                <button
                                                    key={ku.id}
                                                    onClick={() => handleViewUnit(ku)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white/40 border border-black/5 hover:bg-white hover:border-primary/30 rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye size={12} /> {ku.character} • {ku.type}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="px-2 text-[8px] font-bold text-[#CBD5E0] mt-0.5">
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}

                        {/* Streaming indicator */}
                        {isTyping && (
                            <div className="flex flex-col gap-2 items-start animate-in fade-in duration-300 max-w-[85%] lg:max-w-[70%]">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-7 h-7 rounded-lg bg-[#FFF5F5] border border-[#FFDADA] text-[#FFB5B5] flex items-center justify-center shadow-sm">
                                        <Bot size={13} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-[#CBD5E0] tracking-[0.2em]">HANACHAN</span>
                                </div>
                                {streamingContent ? (
                                    <div className="px-5 py-4 rounded-[28px] rounded-tl-none bg-[#F7FAFC] text-foreground border border-[#EDF2F7] text-sm font-medium leading-relaxed shadow-sm relative overflow-hidden">
                                        <div className="whitespace-pre-wrap">{streamingContent}</div>
                                        <span className="inline-block w-1 h-4 bg-primary/60 rounded-full ml-1 animate-pulse align-middle" />
                                    </div>
                                ) : (
                                    <div className="px-6 py-4 rounded-[28px] rounded-tl-none bg-[#F8F9FB] border border-[#EDF2F7] flex gap-2 shadow-sm">
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </>
                )}
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="shrink-0 border-t border-border/50 bg-white/95 backdrop-blur-sm">
                <div className="p-4 lg:p-6">
                    {user ? (
                        <div className="max-w-3xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative flex items-center gap-2 bg-[#F8FAFC] border-2 border-transparent focus-within:border-primary/20 focus-within:bg-white rounded-[2.5rem] p-2 transition-all shadow-lg shadow-[#3E4A61]/5">
                                <input
                                    type="text"
                                    placeholder="Message Hanachan..."
                                    className="flex-1 py-3 pl-4 bg-transparent outline-none text-sm font-medium"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    disabled={isTyping}
                                />
                                <div className="flex items-center gap-1.5 pr-1">
                                    <VoiceRecorder
                                        disabled={isTyping}
                                        onTranscript={handleVoiceTranscript}
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isTyping}
                                        className="w-10 h-10 bg-[#3E4A61] disabled:bg-[#CBD5E0] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white border-2 border-[#FFE4E8] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-primary/10">
                                <div>
                                    <h4 className="text-sm font-black text-[#592E38] uppercase tracking-wider mb-1">Join the Conversation</h4>
                                    <p className="text-xs text-[#592E38]/50 font-medium">Log in to save your history and chat with Hanachan.</p>
                                </div>
                                <button
                                    onClick={() => openLoginModal()}
                                    className="px-8 py-3 bg-gradient-to-r from-primary to-[#D88C9A] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                                >
                                    Sign In Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Entity Quick View Modal */}
            <QuickViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={modalData}
            />

            {isLoadingUnit && (
                <div className="fixed inset-0 z-[110] bg-black/5 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            )}
        </div>
    );
}
