'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Plus, Trash2, Sparkles, Languages, Book, HelpCircle, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { SakuraHeader } from '@/ui/components/sakura/SakuraHeader';
import { useChatSession } from './useChatSession';

// Define Props if not imported
interface ChatClientViewProps {
    initialConversations: any[];
    initialConversation: any;
    conversationId?: string;
}

// Mock PendingDeckCard if not found (I'll assume it might be missing or complex, minimal mock here just in case)
function PendingDeckCard({ name, description, items, onConfirm, onCancel, isLoading }: any) {
    return (
        <div className="bg-white p-4 rounded-xl border border-sakura-divider">
            <h3 className="font-bold">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
            <div className="flex gap-2 mt-2">
                <button onClick={onConfirm} className="bg-green-500 text-white px-3 py-1 rounded">Add</button>
                <button onClick={onCancel} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
            </div>
        </div>
    );
}

export default function ChatClientView({
    initialConversations,
    initialConversation,
    conversationId
}: ChatClientViewProps) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        conversations,
        messages,
        state: chatState,
        pendingDeck: activePendingDeck,
        createNewConversation,
        sendMessage,
        confirmDeck: handleConfirmDeck,
        cancelDeck: handleCancelDeck,
        deleteConversation,
        canSend
    } = useChatSession({ conversationId, initialConversation });

    const isLoading = chatState === 'sending' || chatState === 'waiting_for_ai' || chatState === 'creating_conversation';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activePendingDeck]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !canSend) return;
        const content = inputValue.trim();
        setInputValue('');
        await sendMessage(content);
    };

    const handleNewConversation = async () => {
        const id = await createNewConversation();
        router.push(`/chat?id=${id}`);
    };

    const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete session?')) {
            await deleteConversation(id);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-sakura-bg-app relative">
            {/* Texture Overlay */}
            <div className="relative z-10 flex flex-col h-full overflow-hidden">
                <div className="shrink-0">
                    <SakuraHeader
                        title="Hana Assistant"
                        subtitle="High-Fidelity AI"
                        subtitleColor="#7C3AED"
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="p-2 text-sakura-cocoa hover:bg-sakura-cocoa/5 rounded-full transition-colors"
                                >
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        }
                    />
                </div>

                <div className="flex-1 flex overflow-hidden relative min-h-0">
                    {/* Sidebar - MUTED BACKGROUND */}
                    <aside className={cn(
                        "w-72 bg-[#FBF9F9] border-r border-sakura-divider flex flex-col transition-all duration-300 z-20 shrink-0",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute inset-y-0"
                    )}>
                        <div className="p-6 border-b border-sakura-divider bg-white/50 backdrop-blur-sm">
                            <button
                                onClick={handleNewConversation}
                                className="w-full h-12 flex items-center justify-center gap-2 px-4 bg-sakura-rose text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#4A262C] active:scale-95 transition-all shadow-md shadow-sakura-rose/20"
                            >
                                <Plus size={18} /> New Session
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                            <h3 className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-sakura-cocoa/40">Chronicle</h3>
                            {conversations && conversations.map((conv: any) => (
                                <div
                                    key={conv.id}
                                    onClick={() => router.push(`/chat?id=${conv.id}`)}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all border",
                                        conversationId === conv.id
                                            ? "bg-white border-sakura-divider shadow-sm ring-1 ring-sakura-rose/5"
                                            : "hover:bg-white/60 border-transparent"
                                    )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                        conversationId === conv.id ? "bg-sakura-rose/10 text-sakura-rose" : "bg-sakura-cocoa/5 text-sakura-cocoa/30 group-hover:bg-white"
                                    )}>
                                        <MessageCircle size={14} />
                                    </div>
                                    <span className={cn(
                                        "flex-1 text-[11px] truncate",
                                        conversationId === conv.id ? "font-black text-sakura-ink" : "font-bold text-sakura-cocoa/50"
                                    )}>{conv.title || "Untitled Session"}</span>
                                    <button onClick={(e) => handleDeleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all text-sakura-cocoa/20"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Chat Area - LIGHT CONTRAST BACKGROUND */}
                    <main className="flex-1 flex flex-col min-w-0 bg-[#F6F4F4] relative overflow-hidden min-h-0">
                        {/* Messages Panel */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 no-scrollbar scroll-smooth min-h-0">
                            {messages.length === 0 && (
                                <div className="min-h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-10">
                                    <div className="w-20 h-20 bg-white rounded-[2rem] border border-sakura-divider flex items-center justify-center mb-6">
                                        <Sparkles size={32} className="text-purple-600 animate-pulse" />
                                    </div>
                                    <h2 className="text-3xl font-black text-sakura-ink mb-3 tracking-tighter uppercase">Kon&apos;nichiwa!</h2>
                                    <p className="text-sakura-cocoa/60 font-medium leading-relaxed mb-8 max-w-sm">
                                        I&apos;m your high-fidelity Japanese tutor. Ready to synthesize custom flashcards?
                                    </p>

                                    {/* Suggestion Chips */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                        <SuggestionChip
                                            icon={Languages}
                                            text="Explain JLPT N3 Grammar"
                                            onClick={() => setInputValue("Can you explain some common JLPT N3 grammar points?")}
                                        />
                                        <SuggestionChip
                                            icon={Book}
                                            text="Analyze news headline"
                                            onClick={() => setInputValue("Analyze this headline: ")}
                                        />
                                        <SuggestionChip
                                            icon={HelpCircle}
                                            text="Synthesis tips"
                                            onClick={() => setInputValue("Give me some tips for effectively studying Kanji.")}
                                        />
                                        <SuggestionChip
                                            icon={Sparkles}
                                            text="Roleplay Session"
                                            onClick={() => setInputValue("日本語で話しましょう！")}
                                        />
                                    </div>
                                </div>
                            )}

                            {messages.map((msg: any, idx: number) => (
                                <div key={idx} className={cn("w-full flex gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border mt-1",
                                        msg.role === 'user' ? "bg-white border-sakura-divider" : "bg-sakura-ink border-transparent"
                                    )}>
                                        {msg.role === 'user' ? <MessageCircle size={18} className="text-sakura-cocoa" /> : <Sparkles size={18} className="text-purple-400" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[85%] md:max-w-3xl rounded-[2rem] px-7 py-5 relative leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-sakura-rose text-white rounded-tr-none font-bold shadow-sakura-rose/10"
                                            : "bg-white border border-sakura-divider rounded-tl-none font-medium text-sakura-ink"
                                    )}>
                                        {msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-sakura text-sakura-ink leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Pending Deck / AI Actions */}
                            {activePendingDeck && (
                                <div className="flex justify-start gap-4">
                                    <div className="w-10 h-10 bg-sakura-ink rounded-2xl flex items-center justify-center shrink-0"><Sparkles size={18} className="text-purple-400" /></div>
                                    <PendingDeckCard
                                        name={activePendingDeck.name}
                                        description={activePendingDeck.description}
                                        items={activePendingDeck.items}
                                        onConfirm={handleConfirmDeck}
                                        onCancel={handleCancelDeck}
                                        isLoading={isLoading}
                                    />
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-sakura-ink rounded-2xl flex items-center justify-center"><Sparkles size={18} className="text-purple-400 animate-pulse" /></div>
                                    <div className="bg-white border border-sakura-divider rounded-[1.5rem] px-6 py-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-40 shrink-0" />
                        </div>

                        {/* Input Area (Floating Capsule) */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 pointer-events-none z-10">
                            <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl border border-sakura-divider rounded-[2.5rem] p-3 flex items-center gap-3 focus-within:border-sakura-rose/40 transition-all ring-8 ring-transparent focus-within:ring-sakura-rose/5 shadow-2xl pointer-events-auto">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Message Hana AI..."
                                    className="flex-1 px-6 py-3 bg-transparent outline-none font-bold text-sm text-sakura-ink placeholder:text-sakura-cocoa/30"
                                    disabled={isLoading || !!activePendingDeck}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className={cn(
                                        "w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 shadow-lg",
                                        inputValue.trim() && !isLoading ? "bg-sakura-rose text-white shadow-sakura-rose/20" : "bg-sakura-bg-app text-sakura-cocoa/20"
                                    )}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Sticker */}
                <div className="fixed bottom-6 left-20 w-32 h-32 pointer-events-none opacity-80 z-20">
                    <img src="/review_time.png" alt="Review Time" className="w-full h-full object-contain rotate-12" />
                </div>
            </div>
        </div>
    );
}

function SuggestionChip({ icon: Icon, text, onClick }: { icon: any, text: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 px-5 py-4 bg-white hover:bg-sakura-bg-app border border-sakura-divider rounded-2xl text-left transition-all group hover:border-sakura-cocoa/20"
        >
            <div className="w-8 h-8 rounded-xl bg-white border border-sakura-divider flex items-center justify-center text-sakura-cocoa/40 group-hover:text-purple-600 transition-all">
                <Icon size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sakura-ink flex-1">{text}</span>
        </button>
    );
}
