'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/ui/components/ui/button';
import { PageHeader } from '@/ui/components/PageHeader';
import { MessageSquare, Send, Sparkles, Bot, User, Search, BookOpen, Mic, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mineSentenceAction } from '@/features/mining/actions';
import { MiningModal } from '@/features/mining/components/MiningModal';


const hasJapanese = (text: string) => /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isThinking?: boolean;
    toolCalls?: string[]; // Descriptions of tools being used
}

import { sendMessageAction, getSessionHistoryAction, getUserSessionsAction, createSessionAction } from '@/features/chat/actions';
import { useUser } from '@/features/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
    const { user } = useUser();
    const [input, setInput] = useState('');
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [mineModalOpen, setMineModalOpen] = useState(false);
    const [mineMode, setMineMode] = useState<'word' | 'sentence'>('word');
    const [mineInitialData, setMineInitialData] = useState<any>({});

    const openMineModal = (mode: 'word' | 'sentence', data: any) => {
        setMineMode(mode);
        setMineInitialData(data);
        setMineModalOpen(true);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    useEffect(() => {
        if (user) loadSessions();
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadSessions = async () => {
        setIsHistoryLoading(true);
        try {
            const data = await getUserSessionsAction();
            setSessions(data);
            if (data.length > 0 && !currentSessionId) {
                switchSession(data[0].id);
            } else if (data.length === 0) {
                startNewChat();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const switchSession = async (id: string) => {
        setCurrentSessionId(id);
        setIsLoading(true);
        try {
            const history = await getSessionHistoryAction(id);
            if (history) {
                setMessages(history.messages.map((m: any, i: number) => ({
                    id: `${id}-${i}`,
                    role: m.role as any,
                    content: m.content,
                    timestamp: m.timestamp
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        const newId = crypto.randomUUID();
        setCurrentSessionId(newId);
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: 'Hello! I am Hanachan AI. How can I help you with your Japanese study today?'
            }
        ]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !currentSessionId) return;

        const sessionToUse = currentSessionId;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await sendMessageAction(sessionToUse, userMsg.content);

            if (res.success) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: res.reply || ''
                };
                setMessages(prev => [...prev, botMsg]);
                // Refresh sessions to update titles/order if it was a new session
                loadSessions();
            } else {
                setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "Error: " + res.error }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "Network error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex animate-in fade-in duration-500 gap-6">

            {/* Sidebar History */}
            <div className="w-72 flex flex-col gap-4">
                <Button
                    onClick={startNewChat}
                    className="w-full h-12 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> New Conversation
                </Button>

                <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100/50">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recent Chats</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isHistoryLoading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-10 bg-slate-100/50 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">No history yet</div>
                        ) : (
                            sessions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => switchSession(s.id)}
                                    className={cn(
                                        "w-full p-3 rounded-xl text-left transition-all duration-300 group",
                                        currentSessionId === s.id
                                            ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                                            : "hover:bg-slate-50 text-slate-500"
                                    )}
                                >
                                    <div className="text-xs font-bold truncate pr-2">{s.title || "Untitled Chat"}</div>
                                    <div className="text-[9px] font-medium opacity-50 mt-1 uppercase tracking-tighter">
                                        {formatDistanceToNow(new Date(s.updated_at))} ago
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col">
                <PageHeader
                    title="Hana AI Tutor"
                    subtitle="Interactive Japanese Learning Assistant"
                    icon={Bot}
                    iconColor="text-emerald-600"
                />

                <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden flex flex-col mt-4 relative">
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "animate-in slide-in-from-left-2 duration-300")}>

                                {/* Avatar */}
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", msg.role === 'user' ? "bg-slate-800 text-white" : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white")}>
                                    {msg.role === 'user' ? <User size={24} /> : <Bot size={24} />}
                                </div>

                                {/* Bubble */}
                                <div className={cn("space-y-2", msg.role === 'user' ? "text-right" : "text-left")}>
                                    <div className={cn(
                                        "px-8 py-5 rounded-[28px] text-[15px] leading-relaxed shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                                        msg.role === 'user'
                                            ? "bg-slate-800 text-white rounded-tr-sm"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"
                                    )}>
                                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                        {msg.role === 'assistant' && hasJapanese(msg.content) && (
                                            <button
                                                onClick={() => openMineModal('sentence', {
                                                    textJa: msg.content,
                                                    sourceType: 'chat'
                                                })}
                                                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-700 transition-all bg-emerald-50/50 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50 shadow-sm"
                                            >
                                                <PenTool size={12} /> Mine Sentence
                                            </button>

                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 max-w-[85%] animate-pulse">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                                    <Bot size={24} />
                                </div>
                                <div className="bg-white px-8 py-5 rounded-[28px] rounded-tl-sm border border-slate-100 shadow-sm flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-slate-100/50">
                        <form onSubmit={handleSubmit} className="relative flex items-center gap-4">
                            <Button type="button" variant="ghost" className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl w-14 h-14 p-0 transition-all">
                                <Mic size={24} />
                            </Button>
                            <div className="flex-1 relative group">
                                <input
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-3xl px-8 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 transition-all outline-none pr-16"
                                    placeholder="Message Hanachan..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className={cn(
                                        "absolute right-2 top-2 rounded-2xl w-12 h-12 p-0 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center",
                                        input.trim() ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    <Send size={20} className={input.trim() ? "ml-1" : ""} />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <MiningModal
                isOpen={mineModalOpen}
                onClose={() => setMineModalOpen(false)}
                initialData={mineInitialData}
                mode={mineMode}
            />
        </div >
    );
}


