'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Bot, User, Plus, MessageSquare, Menu, Loader2,
    ChevronLeft, Eye, Square, Pencil, Check, X, Trash2,
    Clock, MoreHorizontal
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';
import { QuickViewModal, QuickViewData } from '@/components/shared/QuickViewModal';
import { mapUnitToQuickView } from '@/features/knowledge/ui-mapper';
import { getKnowledgeUnit } from '@/features/knowledge/actions';
import { HanaTime } from '@/lib/time';
import { useChatSession } from '@/features/chat/hooks/useChatSession';
import {
    listMemorySessions,
    endMemorySession,
    updateMemorySession,
    type MemorySession,
} from '@/lib/memory-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolsUsed?: string[];
    referencedUnits?: { id: string; slug: string; character: string; type: string }[];
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
    session: MemorySession;
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

export default function ChatbotPage() {
    const { user } = useUser();
    const [input, setInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Active thread tracking
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    // Thread list state (managed locally for optimistic updates)
    const [threads, setThreads] = useState<MemorySession[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<QuickViewData | null>(null);
    const [isLoadingUnit, setIsLoadingUnit] = useState(false);

    // Use the chat session hook
    const {
        messages: hookMessages,
        streaming,
        memorySessions,
        sessionTitle,
        sendMessageStreaming,
        stopStream,
        createNewConversation,
        loadThreadHistory,
    } = useChatSession(user?.id);

    // Convert hook messages to local Message type
    const messages: Message[] = hookMessages.map((m, i) => ({
        id: `${i}-${m.timestamp}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp || HanaTime.getNowISO(),
    }));

    // Sync threads from hook
    useEffect(() => {
        setThreads(memorySessions);
    }, [memorySessions]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streaming.isStreaming, mounted]);

    const refreshThreads = useCallback(async () => {
        if (!user?.id) return;
        setLoadingThreads(true);
        try {
            const data = await listMemorySessions(user.id);
            setThreads(data);
        } catch {
            // Memory API may be offline
        } finally {
            setLoadingThreads(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (mounted && user?.id) refreshThreads();
    }, [mounted, user?.id, refreshThreads]);

    const handleSend = async () => {
        if (!input.trim() || streaming.isStreaming) return;
        const content = input;
        setInput('');
        await sendMessageStreaming(content);
        // Refresh thread list after sending
        setTimeout(() => refreshThreads(), 1500);
    };

    const handleNewThread = async () => {
        await createNewConversation();
        setActiveThreadId(null);
        await refreshThreads();
    };

    const handleSelectThread = async (session: MemorySession) => {
        setActiveThreadId(session.session_id);
        await loadThreadHistory(session.session_id);
    };

    const handleRenameThread = async (sessionId: string, newTitle: string) => {
        try {
            await updateMemorySession(sessionId, { title: newTitle });
            setThreads(prev => prev.map(t =>
                t.session_id === sessionId ? { ...t, title: newTitle } : t
            ));
        } catch {
            // ignore
        }
    };

    const handleDeleteThread = async (sessionId: string) => {
        try {
            await endMemorySession(sessionId, false);
            setThreads(prev => prev.filter(t => t.session_id !== sessionId));
            if (activeThreadId === sessionId) {
                setActiveThreadId(null);
                await createNewConversation();
            }
        } catch {
            // ignore
        }
    };

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

    return (
        <div className="flex h-full bg-[#FFFDFD] overflow-hidden rounded-[32px] border border-[#F0E0E0] shadow-sm relative">
            {/* ── Sidebar ── */}
            <aside className={clsx(
                'border-r border-[#F0E0E0] flex flex-col shrink-0 bg-white/50 backdrop-blur-sm transition-all duration-500 ease-in-out',
                sidebarOpen ? 'w-72' : 'w-0 opacity-0 overflow-hidden'
            )}>
                {/* Sidebar header */}
                <div className="p-4 border-b border-[#F0E0E0] flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0]">Threads</span>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 hover:bg-[#F7FAFC] rounded-lg transition-colors text-foreground/30 hover:text-foreground/60"
                        >
                            <ChevronLeft size={13} />
                        </button>
                    </div>
                    <button
                        onClick={handleNewThread}
                        className="w-full py-2.5 bg-primary hover:opacity-90 text-white rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={14} />
                        NEW THREAD
                    </button>
                </div>

                {/* Thread list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                    {loadingThreads && threads.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={16} className="animate-spin text-[#CBD5E0]" />
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <MessageSquare size={32} className="mx-auto mb-3 text-[#CBD5E0]/50" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#CBD5E0]">No threads yet</p>
                            <p className="text-[8px] text-foreground/20 mt-1">Start a conversation to create your first thread</p>
                        </div>
                    ) : (
                        threads.map(session => (
                            <ThreadItem
                                key={session.session_id}
                                session={session}
                                isActive={activeThreadId === session.session_id}
                                onSelect={() => handleSelectThread(session)}
                                onRename={(title) => handleRenameThread(session.session_id, title)}
                                onDelete={() => handleDeleteThread(session.session_id)}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* ── Chat Interface ── */}
            <main className="flex-1 flex flex-col relative bg-white min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-surface/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 hover:bg-surface-muted rounded-xl transition-colors border border-border"
                            >
                                <Menu size={15} className="text-foreground/40" />
                            </button>
                        )}
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <div className="min-w-0">
                            <h2 className="text-sm font-black text-foreground tracking-tighter uppercase truncate">
                                {sessionTitle || 'ASSISTANT'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isTyping && (
                            <button
                                onClick={stopStream}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                                <Square size={9} />
                                Stop
                            </button>
                        )}
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar pb-28">
                    {messages.length === 0 && !isTyping && (
                        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">
                                花
                            </div>
                            <h3 className="text-base font-black text-[#3E4A61] mb-2">Konnichiwa!</h3>
                            <p className="text-sm text-foreground/40 font-medium max-w-xs leading-relaxed">
                                I'm Hanachan, your Japanese language tutor. Ask me anything about Japanese language, grammar, or culture.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-sm">
                                {[
                                    'What does 食べる mean?',
                                    'Explain て-form',
                                    'How do I say "I want to eat"?',
                                    'What\'s my current level?',
                                ].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setInput(suggestion); }}
                                        className="px-3 py-1.5 bg-[#F7FAFC] border border-[#F0E0E0] hover:border-primary/30 rounded-xl text-[10px] font-bold text-foreground/50 hover:text-foreground transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            data-testid="chat-message"
                            className={clsx(
                                'flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500',
                                m.role === 'user' ? 'items-end ml-auto max-w-[80%]' : 'items-start max-w-[80%]'
                            )}
                        >
                            <div className={clsx(
                                'flex items-center gap-2',
                                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            )}>
                                <div className={clsx(
                                    'w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-300',
                                    m.role === 'user'
                                        ? 'bg-[#F7FAFC] border-[#F0E0E0] text-[#A0AEC0]'
                                        : 'bg-[#FFF5F5] border-[#FFDADA] text-[#FFB5B5]'
                                )}>
                                    {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                </div>
                                <span className="text-[8px] font-black uppercase text-[#CBD5E0] tracking-[0.2em]">
                                    {m.role === 'user' ? 'YOU' : 'HANACHAN'} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className={clsx(
                                'px-4 py-3 rounded-[20px] text-sm font-medium leading-relaxed shadow-sm',
                                m.role === 'user'
                                    ? 'bg-foreground text-white rounded-tr-none'
                                    : 'bg-surface-muted text-foreground border border-border rounded-tl-none'
                            )}>
                                <div className="whitespace-pre-wrap">{m.content}</div>

                                {m.referencedUnits && m.referencedUnits.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#EDF2F7]">
                                        <h4 className="w-full text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">Referenced Content</h4>
                                        {m.referencedUnits.map(ku => (
                                            <button
                                                key={ku.id}
                                                onClick={() => handleViewUnit(ku)}
                                                data-testid="ku-cta-button"
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[9px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm active:scale-95"
                                            >
                                                <Eye size={10} /> {ku.character} • {ku.type.slice(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Streaming indicator */}
                    {isTyping && (
                        <div className="flex flex-col gap-2 items-start animate-in fade-in duration-300 max-w-[80%]">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#FFF5F5] border border-[#FFDADA] text-[#FFB5B5] flex items-center justify-center">
                                    <Bot size={12} />
                                </div>
                                <span className="text-[8px] font-black uppercase text-[#CBD5E0] tracking-[0.2em]">HANACHAN</span>
                            </div>
                            {streamingContent ? (
                                <div className="px-4 py-3 rounded-[20px] rounded-tl-none bg-surface-muted text-foreground border border-border text-sm font-medium leading-relaxed shadow-sm">
                                    <div className="whitespace-pre-wrap">{streamingContent}</div>
                                    <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm ml-0.5 animate-pulse align-middle" />
                                </div>
                            ) : (
                                <div className="px-5 py-3.5 rounded-[20px] rounded-tl-none bg-[#F7FAFC] border border-[#F0E0E0] flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[#FFB5B5]/60 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-[#FFB5B5]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-[#FFB5B5]/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
                    <div className="max-w-2xl mx-auto relative group pointer-events-auto">
                        <input
                            type="text"
                            data-testid="chat-input"
                            placeholder="Ask about Japanese language, grammar, or culture..."
                            className="w-full py-4 pl-5 pr-16 bg-[#F7FAFC] border-2 border-[#EDF2F7] rounded-[2rem] outline-none focus:border-[#FFB5B5] focus:bg-white transition-all text-sm font-medium shadow-lg shadow-[#3E4A61]/5"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSend}
                            data-testid="chat-send-button"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#3E4A61] disabled:bg-[#CBD5E0] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </main>

            {/* Entity Quick View Modal */}
            <QuickViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={modalData}
            />

            {isLoadingUnit && (
                <div className="fixed inset-0 z-[110] bg-black/5 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-[#FFB5B5]" size={40} />
                </div>
            )}
        </div>
    );
}
