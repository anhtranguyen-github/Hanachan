'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    MessageSquare,
    Plus,
    ChevronLeft,
    Loader2,
    Clock,
    MoreHorizontal,
    Pencil,
    Trash2,
    Check,
    X,
    ChevronRight,
    Sidebar as SidebarIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { useChat } from '@/features/chat/context/ChatContext';
import { MemorySession, updateMemorySession, endMemorySession } from '@/lib/memory-client';

// ─── Formatting Helper ────────────────────────────────────────────────────────

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
                        <div className="text-[8px] text-foreground/20 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Clock size={8} />
                            {formatRelativeTime(session.updated_at)}
                        </div>
                    </>
                )}
            </div>

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

// ─── Sidebar Component ────────────────────────────────────────────────────────

export function ChatSidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
    const {
        threads,
        isLoading,
        activeThread,
        loadThreadHistory,
        createNewConversation,
        loadMemorySessions,
        renameThread,
        endCurrentThread
    } = useChat();

    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (activeThread) {
            setActiveId(activeThread.session_id);
        } else {
            setActiveId(null);
        }
    }, [activeThread]);

    const handleNewThread = async () => {
        await createNewConversation();
        setActiveId(null);
    };

    const handleSelectThread = async (session: MemorySession) => {
        setActiveId(session.session_id);
        await loadThreadHistory(session.session_id);
    };

    const handleRename = async (sessionId: string, newTitle: string) => {
        try {
            await updateMemorySession(sessionId, { title: newTitle });
            await loadMemorySessions();
        } catch { /* ignore */ }
    };

    const handleDelete = async (sessionId: string) => {
        try {
            await endMemorySession(sessionId, false);
            await loadMemorySessions();
            if (activeId === sessionId) {
                setActiveId(null);
                await createNewConversation();
            }
        } catch { /* ignore */ }
    };

    // Determine if we should show the empty/loading state
    const showEmptyState = !isLoading && threads.length === 0;
    const showLoadingState = isLoading && threads.length === 0;

    return (
        <aside className={clsx(
            'flex flex-col shrink-0 border-r border-[#F0E0E0] bg-[#FAFBFC] transition-all duration-300 ease-in-out z-40',
            // Desktop: relative in flex flow. Mobile: absolute overlay relative to ChatLayout.
            'lg:relative absolute inset-y-0 left-0 h-full',
            isOpen ? 'w-80 shadow-2xl lg:shadow-none translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none border-none'
        )}>
            {/* Collapse / Close Button inside Sidebar */}
            <button
                onClick={onToggle}
                className={clsx(
                    "absolute top-5 -right-3.5 z-50 w-7 h-7 bg-white border border-[#F0E0E0] rounded-full flex items-center justify-center text-[#A0AEC0] hover:text-primary transition-all shadow-md group-hover/sidebar:scale-110 active:scale-95",
                    !isOpen && "rotate-180 opacity-0 pointer-events-none"
                )}
                title="Collapse history"
            >
                <ChevronLeft size={14} />
            </button>

            {/* Sidebar Header - Pinned to Top */}
            <div className="p-4 border-b border-[#F0E0E0] shrink-0 bg-white/40 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Saved Conversations</span>
                </div>
                <button
                    onClick={handleNewThread}
                    className="w-full py-3 bg-[#3E4A61] hover:bg-[#2C3647] text-white rounded-xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-[#3E4A61]/10 border border-[#3E4A61]/10"
                >
                    <Plus size={16} strokeWidth={3} />
                    NEW THREAD
                </button>
            </div>

            {/* Sidebar Content - Scrollable Thread List */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                {showLoadingState ? (
                    // Loading State - Centered
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <Loader2 size={28} className="animate-spin text-primary relative z-10" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-primary uppercase animate-pulse">Loading History...</span>
                    </div>
                ) : showEmptyState ? (
                    // Empty State - Perfectly Centered
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 rounded-[2rem] bg-white border border-[#F0E0E0] flex items-center justify-center mb-6 shadow-sm">
                            <MessageSquare size={24} className="text-[#CBD5E0]" />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3E4A61] mb-2 leading-tight">No history found</h3>
                        <p className="text-[10px] text-foreground/30 font-medium leading-relaxed max-w-[200px]">
                            Your past conversations with Hanachan will magically appear here.
                        </p>
                    </div>
                ) : (
                    // Thread List - Scrollable
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                        {threads.map(session => (
                            <ThreadItem
                                key={session.session_id}
                                session={session}
                                isActive={activeId === session.session_id}
                                onSelect={() => handleSelectThread(session)}
                                onRename={(title) => handleRename(session.session_id, title)}
                                onDelete={() => handleDelete(session.session_id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Sync Status - Pinned to Bottom */}
            <div className="p-4 border-t border-[#F0E0E0] bg-white/20 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/60 rounded-xl border border-white shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">Sync Active</span>
                </div>
            </div>
        </aside>
    );
}
