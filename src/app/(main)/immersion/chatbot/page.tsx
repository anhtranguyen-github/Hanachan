'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Plus, MessageSquare, Menu, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { GlassCard } from '@/components/premium/GlassCard';
import { useUser } from '@/features/auth/AuthContext';
import { QuickViewModal, QuickViewData } from '@/components/shared/QuickViewModal';
import { mapKUToQuickView } from '@/features/knowledge/ui-mapper';
import { getLocalKU } from '@/features/knowledge/actions';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolsUsed?: string[];
    referencedKUs?: { id: string; slug: string; character: string; type: string }[];
};

export default function ChatbotPage() {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userLevel, setUserLevel] = useState(1);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<QuickViewData | null>(null);
    const [isLoadingKU, setIsLoadingKU] = useState(false);

    const setDefaultWelcome = () => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: 'Konnichiwa! I am Hanachan, your Japanese language tutor. I can help you search the database, analyze sentences, or tell you about your progress. How can I help you study today?',
                timestamp: new Date().toISOString()
            }
        ]);
    };

    useEffect(() => {
        setMounted(true);
        setDefaultWelcome();
    }, []);

    useEffect(() => {
        if (mounted) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, mounted]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    userId: user?.id
                })
            });

            const data = await response.json();

            if (data.success) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date().toISOString(),
                    toolsUsed: data.toolsUsed,
                    referencedKUs: data.referencedKUs
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I apologize, but I encountered a disruption in my neural link. Please try again.",
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleViewKU = async (ku: { id: string; slug: string; type: string }) => {
        setIsLoadingKU(true);
        try {
            const fullKU = await getLocalKU(ku.type, ku.slug);
            if (fullKU) {
                setModalData(mapKUToQuickView(fullKU as any));
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to load KU details:", err);
        } finally {
            setIsLoadingKU(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background text-foreground overflow-hidden">
            {/* History Sidebar */}
            <aside className={clsx(
                "bg-surface-muted border-r border-border transition-all duration-300 flex flex-col backdrop-blur-3xl",
                sidebarOpen ? "w-80" : "w-0 overflow-hidden"
            )}>
                <div className="p-6 border-b border-border">
                    <button
                        onClick={() => setMessages([])}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary hover:bg-primary-dark text-foreground rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg"
                    >
                        <Plus size={16} />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.4em] px-3 py-2">
                        Recent Chats
                    </div>
                    <div className="text-center py-20 opacity-20">
                        <MessageSquare size={48} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No previous sessions</p>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col max-w-5xl mx-auto relative px-6 md:px-12">
                {/* Header */}
                <header className="flex items-center justify-between py-10 border-b border-border">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-3 hover:bg-surface-muted rounded-2xl transition-colors border border-border"
                        >
                            <Menu size={20} className="text-foreground/40" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
                                <Bot size={16} />
                                AI Tutor
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Hanachan AI</h1>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 bg-surface-muted border border-border px-6 py-3 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(244,172,183,1)]" />
                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] font-mono">Sync_OK // Level {userLevel}</span>
                    </div>
                </header>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto pt-10 pb-48 space-y-10 scrollbar-hide">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            data-testid="chat-message"
                            className={clsx(
                                "flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
                                m.role === 'user' ? "items-end" : "items-start"
                            )}
                        >
                            <div className={clsx(
                                "flex items-center gap-4",
                                m.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={clsx(
                                    "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-lg",
                                    m.role === 'user' ? "bg-surface-muted border-border text-foreground/40" : "bg-primary text-foreground border-primary"
                                )}>
                                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <span className="text-[9px] font-black uppercase text-foreground/20 tracking-[0.2em] pt-0.5 font-mono">
                                    {m.role === 'user' ? "OPERATOR" : "HANACHAN"} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className={clsx(
                                "p-6 rounded-3xl text-sm font-medium tracking-tight leading-relaxed max-w-[85%] shadow-2xl space-y-4",
                                m.role === 'user'
                                    ? "bg-white/10 text-foreground rounded-tr-none border border-border"
                                    : "bg-surface-muted text-foreground/80 border border-border rounded-tl-none backdrop-blur-xl whitespace-pre-wrap"
                            )}>
                                {m.content}

                                {m.referencedKUs && m.referencedKUs.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/10">
                                        {m.referencedKUs.map(ku => (
                                            <button
                                                key={ku.id}
                                                onClick={() => handleViewKU(ku)}
                                                data-testid="ku-cta-button"
                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                {ku.character} • {ku.type} <ExternalLink size={10} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {m.toolsUsed && m.toolsUsed.length > 0 && (
                                <div className="flex gap-2">
                                    {m.toolsUsed.map(t => (
                                        <div key={t} className="px-3 py-1 bg-surface-muted border border-border rounded-full text-[8px] font-black uppercase tracking-widest text-foreground/20">
                                            {t.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex flex-col gap-4 items-start animate-in fade-in duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-xl bg-primary text-foreground flex items-center justify-center shadow-lg">
                                    <Bot size={16} />
                                </div>
                                <span className="text-[9px] font-black uppercase text-foreground/20 tracking-[0.2em] font-mono">Synthesizing response...</span>
                            </div>
                            <div className="px-6 py-5 rounded-3xl bg-surface-muted border border-border flex gap-2 shadow-2xl backdrop-blur-xl">
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="absolute bottom-10 left-0 right-0">
                    <GlassCard className="p-3 border-border shadow-2xl rounded-[2.5rem] bg-white/[0.03]">
                        <div className="relative flex items-center p-2">
                            <div className="w-12 h-12 flex items-center justify-center text-foreground/20 bg-surface-muted rounded-full border border-border ml-2">
                                <Sparkles size={20} className="animate-pulse text-primary" />
                            </div>
                            <input
                                type="text"
                                data-testid="chat-input"
                                className="flex-1 bg-transparent border-none text-foreground focus:ring-0 placeholder:text-foreground/10 font-bold tracking-tight py-4 px-6 text-lg"
                                placeholder="Type a command or ask a question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSend}
                                data-testid="chat-send-button"
                                disabled={!input.trim() || isTyping}
                                className="bg-primary hover:bg-primary-dark disabled:opacity-20 text-foreground w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_20px_rgba(244,172,183,0.3)] mr-2 group"
                            >
                                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Entity Quick View Modal */}
            <QuickViewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={modalData}
            />

            {isLoadingKU && (
                <div className="fixed inset-0 z-[110] bg-black/20 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            )}
        </div>
    );
}

