
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Plus, MessageCircle, Trash2, Languages, Book, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HanaButton } from '@/ui/components/hana/Button';
import { HanaCard } from '@/ui/components/hana/Card';
import { HanaInput } from '@/ui/components/hana/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    isLoading: boolean;
    sessions: any[];
    activeSessionId?: string;
    onNewSession: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    isLoading,
    sessions,
    activeSessionId,
    onNewSession,
    onSelectSession,
    onDeleteSession
}) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [pendingAction, setPendingAction] = useState<{ type: string; name?: string; description?: string } | null>(null);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [quizActive, setQuizActive] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const lastAssistant = [...messages].reverse().find((msg) => msg.role === 'assistant');
        if (!lastAssistant?.content) return;

        const match = lastAssistant.content.match(/\[ACTION_TRIGGER\]:\s*(\{[\s\S]*\})/);
        if (!match?.[1]) return;

        try {
            const payload = JSON.parse(match[1]);
            setPendingAction({
                type: payload.type,
                name: payload.name,
                description: payload.description
            });
        } catch (error) {
            console.error('Failed to parse ACTION_TRIGGER payload', error);
        }
    }, [messages]);

    const stripMarkers = (content: string) =>
        content
            .replace(/\[QUIZ_MODE\]\s*/g, '')
            .replace(/\[ANALYZE_PROMPT\]\s*/g, '')
            .replace(/\[ANALYSIS_RESULT\]\s*/g, '')
            .replace(/\[ADD_CARD_PROMPT\]\s*/g, '')
            .replace(/\[ACTION_TRIGGER\]:\s*\{[\s\S]*\}/g, '')
            .trim();

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput('');
    };

    return (
        <>
            <div className="flex h-[calc(100dvh-72px)] overflow-hidden bg-sakura-bg-app">
                {/* Sidebar - Sessions List */}
                <aside className="hidden md:flex w-80 flex-col border-r border-sakura-divider bg-white/50 backdrop-blur-md">
                    <div className="p-6">
                        <HanaButton data-testid="chat-new-session" onClick={onNewSession} className="w-full" size="lg">
                            <Plus size={20} /> New Conversation
                        </HanaButton>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 space-y-2">
                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40 mb-2">History</p>
                        {sessions.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => onSelectSession(s.id)}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all",
                                    activeSessionId === s.id
                                        ? "bg-sakura-pink/10 border border-sakura-pink/20"
                                        : "hover:bg-white border border-transparent"
                                )}
                            >
                                <MessageCircle size={18} className={cn(activeSessionId === s.id ? "text-sakura-pink" : "text-sakura-cocoa/30")} />
                                <span className={cn("flex-1 text-sm truncate", activeSessionId === s.id ? "font-black" : "font-bold text-sakura-cocoa/60")}>
                                    {s.title || 'New Chat'}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-torii-red transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="p-8 text-center space-y-2 opacity-30">
                                <Book size={32} className="mx-auto" />
                                <p className="text-xs font-bold uppercase">No history yet</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Chat Hub */}
                <main className="flex-1 flex flex-col relative min-w-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 no-scrollbar">
                        {(isLoading || messages.some((msg) => msg.role === 'assistant')) && (
                            <div data-testid="chat-stream-started" />
                        )}
                        {!isLoading && (
                            <div data-testid="chat-idle" />
                        )}
                        {messages.length === 0 && <EmptyChatState setInput={setInput} />}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                data-testid={msg.role === 'assistant' ? 'bot-message' : msg.role === 'user' ? 'user-message' : 'system-message'}
                                className={cn("flex gap-4 md:gap-6 animate-fadeIn", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2",
                                    msg.role === 'user' ? "bg-white border-sakura-divider" : "bg-sakura-ink border-sakura-ink text-white"
                                )}>
                                    {msg.role === 'user' ? <MessageCircle size={18} /> : <Sparkles size={18} className="text-sakura-pink" />}
                                </div>
                                <HanaCard
                                    variant={msg.role === 'user' ? 'flat' : 'clay'}
                                    padding="sm"
                                    className={cn(
                                        "max-w-[85%] md:max-w-2xl text-sm leading-relaxed",
                                        msg.role === 'user' ? "bg-sakura-pink text-white border-none rounded-tr-none" : "rounded-tl-none"
                                    )}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="font-bold">{msg.content}</p>
                                    ) : (
                                        <div className="prose prose-sm prose-sakura max-w-none font-medium">
                                            <div data-testid="bot-actions" className="flex flex-wrap gap-2 mb-3">
                                                {msg.content.includes('[ANALYZE_PROMPT]') && !showAnalysis && (
                                                    <button
                                                        data-testid="chat-analyze-action"
                                                        onClick={() => setShowAnalysis(true)}
                                                        className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Analyze
                                                    </button>
                                                )}
                                                {showAnalysis && msg.content.includes('Analysis Result') && (
                                                    <div data-testid="chat-analysis-result" className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                        Analysis
                                                    </div>
                                                )}
                                                {msg.content.includes('[QUIZ_MODE]') && !quizActive && (
                                                    <button
                                                        data-testid="chat-start-quiz"
                                                        onClick={() => setQuizActive(true)}
                                                        className="inline-flex items-center gap-2 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Start Quiz
                                                    </button>
                                                )}
                                                {quizActive && (
                                                    <div data-testid="chat-quiz-mode" className="inline-flex items-center gap-2 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                        Quiz Mode
                                                    </div>
                                                )}
                                                {pendingAction?.type === 'TRIGGER_ADD_CARD_MODAL' && !showAddCardModal && (
                                                    <button
                                                        data-testid="chat-open-add-card"
                                                        onClick={() => setShowAddCardModal(true)}
                                                        className="inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Add Card
                                                    </button>
                                                )}
                                            </div>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripMarkers(msg.content)}</ReactMarkdown>
                                        </div>
                                    )}
                                </HanaCard>
                            </div>
                        ))}

                        {isLoading && (
                            <div data-testid="bot-typing" className="flex gap-4 md:gap-6 animate-pulse">
                                <div className="w-10 h-10 bg-sakura-ink rounded-2xl flex items-center justify-center text-white">
                                    <Sparkles size={18} className="text-sakura-pink animate-spin" />
                                </div>
                                <div className="bg-white border-2 border-sakura-divider rounded-2xl rounded-tl-none px-6 py-4 flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-sakura-pink rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-sakura-pink rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-sakura-pink rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} className="h-40" />
                    </div>

                    {/* Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pointer-events-none">
                        <div className="max-w-4xl mx-auto flex items-end gap-3 pointer-events-auto">
                            <HanaCard
                                variant="clay"
                                padding="none"
                                className="flex-1 flex items-center bg-white/90 backdrop-blur-xl border-sakura-pink/20 focus-within:border-sakura-pink transition-colors"
                            >
                                <textarea
                                    data-testid="chat-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask Hana anything about Japanese..."
                                    className="w-full px-6 py-4 bg-transparent outline-none font-bold text-sm resize-none max-h-32"
                                    rows={1}
                                />
                                <div className="pr-3 pb-3">
                                    <HanaButton
                                        data-testid="send-button"
                                        size="icon"
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                    >
                                        <Send size={18} />
                                    </HanaButton>
                                </div>
                            </HanaCard>
                        </div>
                    </div>
                </main>
            </div>

            {pendingAction && pendingAction.type === 'TRIGGER_ADD_CARD_MODAL' && showAddCardModal && (
                <div data-testid="chat-add-card-modal" className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl border border-sakura-divider p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-lg font-black text-sakura-ink">Add Card</h3>
                        <div className="text-sm text-sakura-cocoa/70">
                            <p className="font-bold">{pendingAction.name}</p>
                            <p>{pendingAction.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <HanaButton data-testid="chat-add-card-confirm" onClick={() => { setPendingAction(null); setShowAddCardModal(false); }}>Confirm</HanaButton>
                            <HanaButton data-testid="chat-add-card-cancel" variant="ghost" onClick={() => setShowAddCardModal(false)}>Cancel</HanaButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const EmptyChatState = ({ setInput }: { setInput: (v: string) => void }) => (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 py-20">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] border-2 border-sakura-divider flex items-center justify-center animate-float">
            <Sparkles size={40} className="text-sakura-pink" />
        </div>
        <div className="space-y-4">
            <h2 className="text-4xl font-black text-sakura-ink tracking-tight uppercase">Your Neural Sensei</h2>
            <p className="text-sakura-cocoa/60 font-bold text-lg">
                Translate, analyze, or practice conversation. <br /> I&apos;ll automatically mine cards for you.
            </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <SuggestionBtn icon={Languages} text="Explain sentence structure" onClick={() => setInput("Explain this sentence: 猫が魚を食べました")} />
            <SuggestionBtn icon={HelpCircle} text="N3 Grammar help" onClick={() => setInput("Can you show me some N3 grammar examples?")} />
            <SuggestionBtn icon={Book} text="Vocabulary synthesis" onClick={() => setInput("I want to learn 5 new words about nature.")} />
            <SuggestionBtn icon={Sparkles} text="Let&apos;s Roleplay" onClick={() => setInput("Japanese Roleplay: I'm at a Ramen shop.")} />
        </div>
    </div>
);

const SuggestionBtn = ({ icon: Icon, text, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex items-center gap-4 p-4 bg-white border-2 border-sakura-divider rounded-2xl text-left hover:border-sakura-pink transition-all group"
    >
        <div className="w-10 h-10 rounded-xl bg-sakura-divider flex items-center justify-center group-hover:bg-sakura-pink/10 group-hover:text-sakura-pink transition-colors">
            <Icon size={18} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-sakura-ink leading-tight">{text}</span>
    </button>
);
