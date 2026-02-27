'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Send, Bot, User, Plus, MessageSquare, Menu, Sparkles, Loader2, ExternalLink, ChevronLeft, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { GlassCard } from '@/components/premium/GlassCard';
import { useUser } from '@/features/auth/AuthContext';
import { QuickViewModal, QuickViewData } from '@/components/shared/QuickViewModal';
import { mapUnitToQuickView } from '@/features/knowledge/ui-mapper';
import { getKnowledgeUnit } from '@/features/knowledge/actions';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    toolsUsed?: string[];
    referencedUnits?: { id: string; slug: string; character: string; type: string }[];
};

export default function ChatbotPage() {
    const { user } = useUser();
    const pathname = usePathname();
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
    const [isLoadingUnit, setIsLoadingUnit] = useState(false);

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
                    referencedUnits: data.referencedUnits
                };
                console.log("[ChatbotPage] Received bot message:", { tools: data.toolsUsed?.length, units: data.referencedUnits?.length });
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

    const handleViewUnit = async (unit: { id: string; slug: string; type: string }) => {
        setIsLoadingUnit(true);
        try {
            const fullUnit = await getKnowledgeUnit(unit.type, unit.slug);
            if (fullUnit) {
                setModalData(mapUnitToQuickView(fullUnit as any));
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error("Failed to load unit details:", err);
        } finally {
            setIsLoadingUnit(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex h-full bg-[#FFFDFD] overflow-hidden rounded-[32px] border border-[#F0E0E0] shadow-sm relative">
            {/* Sub-sidebar for History/Context */}
            <aside className={clsx(
                "border-r border-[#F0E0E0] flex flex-col shrink-0 bg-white/50 backdrop-blur-sm transition-all duration-500 ease-in-out",
                sidebarOpen ? "w-80" : "w-0 opacity-0 overflow-hidden"
            )}>
                <div className="p-6">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="w-full py-4 mb-6 border-2 border-[#F0E0E0] text-[#A0AEC0] hover:text-[#3E4A61] hover:border-[#3E4A61]/20 rounded-[20px] font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 bg-white"
                    >
                        <ChevronLeft size={16} />
                        COLLAPSE SIDEBAR
                    </button>

                    <button
                        onClick={() => setMessages([])}
                        className="w-full py-4 bg-[#FFB5B5] hover:bg-[#FFC5C5] text-white rounded-[20px] font-black text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#FFB5B5]/30 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        NEW SESSION
                    </button>
                </div>

                <div className="px-5 flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0] mb-5 px-3">Integration History</h3>
                    <div className="text-center py-20 opacity-20">
                        <MessageSquare size={48} className="mx-auto mb-4 text-[#A0AEC0]" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">No previous logs</p>
                    </div>
                </div>
            </aside>

            {/* Chat Interface */}
            <main className="flex-1 flex flex-col relative bg-white">
                <header className="h-16 border-b border-[#F0E0E0] flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 hover:bg-surface-muted rounded-xl transition-colors border border-border"
                            >
                                <Menu size={16} className="text-foreground/40" />
                            </button>
                        )}
                        <div className="w-1.5 h-1.5 bg-[#FFB5B5] rounded-full animate-pulse" />
                        <div>
                            <h2 className="text-xl font-black text-[#3E4A61] tracking-tighter uppercase">HANACHAN ASSISTANT</h2>
                        </div>
                    </div>

                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-40">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            data-testid="chat-message"
                            className={clsx(
                                "flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                                m.role === 'user' ? "items-end ml-auto max-w-[80%]" : "items-start max-w-[80%]"
                            )}
                        >
                            <div className={clsx(
                                "flex items-center gap-3",
                                m.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={clsx(
                                    "w-7 h-7 rounded-xl flex items-center justify-center border transition-all duration-300",
                                    m.role === 'user' ? "bg-[#F7FAFC] border-[#F0E0E0] text-[#A0AEC0]" : "bg-[#FFF5F5] border-[#FFDADA] text-[#FFB5B5]"
                                )}>
                                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <span className="text-[9px] font-black uppercase text-[#CBD5E0] tracking-[0.2em] pt-0.5">
                                    {m.role === 'user' ? "LEARNER" : "ASSISTANT"} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className={clsx(
                                "p-6 rounded-[32px] text-[14px] font-medium leading-relaxed shadow-sm space-y-4",
                                m.role === 'user'
                                    ? "bg-[#3E4A61] text-white rounded-tr-none"
                                    : "bg-[#F7FAFC] text-[#3E4A61] border border-[#F0E0E0] rounded-tl-none"
                            )}>
                                <div className="whitespace-pre-wrap">{m.content}</div>

                                {m.referencedKUs && m.referencedKUs.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#EDF2F7]">
                                        <h4 className="w-full text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1 flex items-center gap-2">Referenced Content</h4>
                                        {m.referencedKUs.map(ku => (
                                            <button
                                                key={ku.id}
                                                onClick={() => handleViewKU(ku)}
                                                data-testid="ku-cta-button"
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E0E0] hover:border-[#FFB5B5] rounded-xl text-[10px] font-black uppercase text-[#FF6B6B] tracking-wider transition-all shadow-sm active:scale-95"
                                            >
                                                <Eye size={12} /> {ku.character} • {ku.type.slice(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {m.toolsUsed && m.toolsUsed.length > 0 && (
                                <div className="flex gap-2">
                                    {m.toolsUsed.map(t => (
                                        <div key={t} className="px-3 py-1 bg-[#F7FAFC] border border-[#F0E0E0] rounded-full text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">
                                            {t.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex flex-col gap-4 items-start animate-in fade-in duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-[#FFF5F5] border border-[#FFDADA] text-[#FFB5B5] flex items-center justify-center">
                                    <Bot size={14} />
                                </div>
                                <span className="text-[9px] font-black uppercase text-[#CBD5E0] tracking-[0.2em]">Thinking...</span>
                            </div>
                            <div className="px-6 py-4 rounded-3xl bg-[#F7FAFC] border border-[#F0E0E0] flex gap-2">
                                <div className="w-1.5 h-1.5 bg-[#FFB5B5]/40 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-[#FFB5B5]/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-[#FFB5B5]/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
                    <div className="max-w-2xl mx-auto relative group pointer-events-auto">
                        <input
                            type="text"
                            data-testid="chat-input"
                            placeholder="Ask about Japanese language, rules, or culture..."
                            className="w-full py-5 pl-8 pr-20 bg-[#F7FAFC] border-2 border-[#EDF2F7] rounded-[2.5rem] outline-none focus:border-[#FFB5B5] focus:bg-white transition-all text-sm font-medium shadow-xl shadow-[#3E4A61]/5"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSend}
                            data-testid="chat-send-button"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#3E4A61] disabled:bg-[#CBD5E0] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send size={20} />
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

            {isLoadingKU && (
                <div className="fixed inset-0 z-[110] bg-black/5 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-[#FFB5B5]" size={48} />
                </div>
            )}
        </div>
    );
}

