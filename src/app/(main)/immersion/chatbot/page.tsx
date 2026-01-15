
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Send, User, Bot, Sparkles, MessageCircle, Paperclip, Plus,
    ChevronLeft, Clock, MoreVertical, Trash2, Zap, BookOpen,
    Search, Layers, X, CheckCircle2, Wand2, ArrowRight, Brain
} from 'lucide-react';
import { clsx } from 'clsx';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';

// --- Types ---
type BotAction = {
    label: string;
    icon: any;
    type: 'analysis' | 'grammar' | 'drill' | 'add_vocab';
    data?: any;
    color?: string;
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    actions?: BotAction[];
    analysis?: any;
};

export default function ChatbotPage() {
    const { user } = useUser();
    const [sessions, setSessions] = useState<any[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showGrammar, setShowGrammar] = useState(false);
    const [showDeckPicker, setShowDeckPicker] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);

    useEffect(() => {
        if (user) {
            MockDB.getChatSessions(user.id).then(res => {
                setSessions(res);
                if (res.length > 0) {
                    setActiveSessionId(res[0].id);
                }
            });
        }
    }, [user]);

    useEffect(() => {
        if (activeSessionId) {
            const session = sessions.find(s => s.id === activeSessionId);
            if (session) {
                setMessages(session.messages);
            }
        }
    }, [activeSessionId, sessions]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleNewChat = async () => {
        if (!user) return;
        const newSession = await MockDB.createChatSession(user.id, 'New Conversation');
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
        setMessages([]);
    };

    const handleAction = (action: BotAction) => {
        if (action.type === 'analysis') {
            setSelectedData(action.data);
            setShowAnalysis(true);
        } else if (action.type === 'grammar') {
            setSelectedData(action.data);
            setShowGrammar(true);
        } else if (action.type === 'add_vocab') {
            setSelectedData(action.data);
            setShowDeckPicker(true);
        } else if (action.type === 'drill') {
            setLoading(true);
            setTimeout(() => {
                const drillMsg: Message = {
                    role: 'assistant',
                    content: "よし！Hãy thử dịch câu này sang tiếng Nhật: 'I am a cat'. (Dùng cấu trúc ～は～です)",
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, drillMsg]);
                setLoading(false);
            }, 800);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading || !user) return;

        let sessionId = activeSessionId;
        if (!sessionId) {
            const newSession = await MockDB.createChatSession(user.id, input.slice(0, 30));
            setSessions([newSession, ...sessions]);
            sessionId = newSession.id;
            setActiveSessionId(sessionId);
        }

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() };

        // Optimistic update locally
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Actual DB update
        await MockDB.addChatMessage(sessionId, userMsg);

        // Simulate AI response with CTA Layers
        setTimeout(async () => {
            let response = "Chào bạn! Tôi có thể giúp gì cho bạn về tiếng Nhật hôm nay?";
            let actions: BotAction[] = [];
            let analysis = null;

            if (input.includes('猫') || input.includes('neko')) {
                response = "Ah, 猫 (Neko) có nghĩa là 'Con mèo'. Đây là một danh từ rất cơ bản trong tiếng Nhật.";
                actions = [
                    { label: 'Phân tích câu', icon: Search, type: 'analysis', data: { text: '吾輩は猫である。', tokens: [{ s: '吾輩', r: 'わがはい', m: 'Tôi' }, { s: 'は', r: 'ha', m: 'Topic' }, { s: '猫', r: 'ねこ', m: 'Cat' }, { s: 'で', r: 'de', m: 'Be' }, { s: 'ある', r: 'aru', m: 'Exist' }] } },
                    { label: 'Thêm vocab này', icon: Plus, type: 'add_vocab', data: { surface: '猫', reading: 'ねこ', meaning: 'Con mèo' } },
                    { label: 'Luyện nhanh', icon: Zap, type: 'drill' }
                ];
            } else if (input.includes('〜は〜です')) {
                response = "Cấu trúc 〜は〜です dùng để khẳng định A là B. Ví dụ: 私は学生です (Tôi là học sinh).";
                actions = [
                    { label: 'Xem Grammar', icon: BookOpen, type: 'grammar', data: { name: '〜は〜です', meaning: 'Khẳng định A là B', level: 'N5' } },
                    { label: 'Luyện nhanh', icon: Zap, type: 'drill' }
                ];
            } else {
                // Default context-aware CTAs
                actions = [
                    { label: 'Xem phân tích chi tiết', icon: Search, type: 'analysis', data: { text: input, tokens: [] } },
                ];
            }

            const assistantMsg: Message = {
                role: 'assistant',
                content: response,
                actions,
                analysis,
                timestamp: new Date().toISOString()
            };

            await MockDB.addChatMessage(sessionId!, assistantMsg);
            setMessages(prev => [...prev, assistantMsg]);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
            {/* History Sidebar */}
            {sidebarOpen && (
                <aside className="w-72 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-primary-dark uppercase tracking-widest text-[10px] opacity-40">Conversation History</h2>
                        <button
                            onClick={handleNewChat}
                            className="w-10 h-10 bg-primary rounded-clay border-2 border-primary-dark flex items-center justify-center text-white shadow-clay hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
                        {sessions.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSessionId(s.id)}
                                className={clsx(
                                    "p-4 rounded-clay border-2 text-left transition-all group relative overflow-hidden",
                                    activeSessionId === s.id
                                        ? "bg-primary text-white border-primary-dark shadow-clay"
                                        : "bg-white border-transparent hover:bg-primary/5 text-primary-dark"
                                )}
                            >
                                <div className="font-black text-sm truncate pr-6">{s.title}</div>
                                <div className={clsx(
                                    "text-[10px] font-bold opacity-40 mt-1 flex items-center gap-1",
                                    activeSessionId === s.id ? "text-white/70" : "text-primary-dark/40"
                                )}>
                                    <Clock className="w-3 h-3" />
                                    {new Date(s.updated_at).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col gap-4 relative">
                <header className="flex justify-between items-center bg-white p-4 rounded-clay border-2 border-primary-dark shadow-clay-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                        >
                            <ChevronLeft className={clsx("w-6 h-6 text-primary-dark transition-transform", !sidebarOpen && "rotate-180")} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-primary-dark flex items-center gap-2">
                                <Bot className="w-5 h-5 text-primary" />
                                {sessions.find(s => s.id === activeSessionId)?.title || 'Sensei AI'}
                            </h1>
                            <span className="text-[10px] font-black uppercase text-secondary">Learning Assistant</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 clay-card p-0 bg-white relative flex flex-col overflow-hidden border-4 border-primary-dark">
                    <div
                        ref={scrollRef}
                        className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 custom-scrollbar bg-[radial-gradient(#f3f4f6_1px,transparent_1px)] [background-size:32px_32px]"
                    >
                        {messages.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 opacity-20">
                                <Sparkles className="w-20 h-20 animate-pulse text-primary" />
                                <div>
                                    <h3 className="text-2xl font-black text-primary-dark uppercase tracking-widest">Hajimemashou!</h3>
                                    <p className="font-bold text-lg">Type any Japanese phrase to analyze or ask a question.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setInput('猫について教えて')} className="clay-btn bg-white text-xs py-2">"Nhờ giải thích về 猫"</button>
                                    <button onClick={() => setInput('Khi nào dùng 〜は〜です?')} className="clay-btn bg-white text-xs py-2">"Khi nào dùng 〜は?"</button>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={clsx(
                                    "flex gap-4 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                <div className={clsx(
                                    "w-10 h-10 rounded-clay border-2 border-primary-dark flex-shrink-0 flex items-center justify-center shadow-clay",
                                    msg.role === 'user' ? "bg-secondary" : "bg-primary"
                                )}>
                                    {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className={clsx(
                                        "p-5 rounded-[24px] border-2 border-primary-dark shadow-clay font-bold leading-relaxed whitespace-pre-wrap",
                                        msg.role === 'user' ? "bg-secondary text-white" : "bg-white text-primary-dark"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {/* Action CTA Layer */}
                                    {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500 delay-300">
                                            {msg.actions.map((action, ai) => (
                                                <button
                                                    key={ai}
                                                    onClick={() => handleAction(action)}
                                                    className="clay-btn bg-primary/5 !text-primary border-primary/20 hover:bg-primary hover:!text-white text-[10px] py-1.5 px-3 flex items-center gap-1.5 shadow-none hover:shadow-clay transition-all"
                                                >
                                                    <action.icon className="w-3.5 h-3.5" />
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className={clsx(
                                        "text-[8px] font-black uppercase tracking-widest px-2 opacity-40",
                                        msg.role === 'user' ? "text-right" : "text-left"
                                    )}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-4 max-w-[80%]">
                                <div className="w-10 h-10 rounded-clay border-2 border-primary-dark bg-primary flex items-center justify-center shadow-clay">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div className="p-4 rounded-[24px] border-2 border-primary-dark bg-primary/5 flex gap-1.5 items-center">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-background border-t-4 border-primary-dark">
                        <div className="flex gap-4 items-center max-w-4xl mx-auto">
                            <button className="p-2 text-primary-dark opacity-30 hover:opacity-100 hover:text-primary transition-all">
                                <Plus className="w-6 h-6" />
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    className="clay-input pr-16 py-4 text-base"
                                    placeholder="Type Japanese or ask about grammar..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-clay border-2 border-primary-dark shadow-clay flex items-center justify-center text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Modals for CTA Interactions --- */}

            {/* 1. Sentence Analysis Modal */}
            {showAnalysis && selectedData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-2xl w-full bg-white p-10 relative animate-in zoom-in-95 duration-200 border-4 border-primary-dark">
                        <button onClick={() => setShowAnalysis(false)} className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full text-primary-dark/30"><X className="w-6 h-6" /></button>

                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-clay border-2 border-primary-dark flex items-center justify-center text-white shadow-clay"><Search className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-primary-dark uppercase">Chi tiết phân tích</h2>
                                    <p className="text-sm font-bold text-primary-dark/40">Sentence Breakdown & Morphological Highlighting</p>
                                </div>
                            </div>

                            <div className="p-8 bg-background rounded-clay border-2 border-primary-dark shadow-inset text-center">
                                <div className="flex flex-wrap justify-center gap-4 mb-4">
                                    {selectedData.tokens?.map((t: any, i: number) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <span className="text-xs font-black text-primary opacity-60">{t.r}</span>
                                            <span className="text-4xl font-black text-primary-dark">{t.s}</span>
                                        </div>
                                    ))}
                                    {(!selectedData.tokens || selectedData.tokens.length === 0) && (
                                        <span className="text-4xl font-black text-primary-dark">{selectedData.text}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="clay-card bg-primary/5 p-6 border-dashed border-primary">
                                    <h3 className="text-[10px] font-black uppercase text-primary mb-2">Grammar Points Identified</h3>
                                    <ul className="flex flex-col gap-2">
                                        <li className="flex items-center justify-between p-2 bg-white rounded border border-primary/20">
                                            <span className="font-black text-sm text-primary-dark">〜は</span>
                                            <span className="text-[8px] font-black bg-primary text-white p-1 rounded">PARTICLE</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="clay-card bg-secondary/5 p-6 border-dashed border-secondary">
                                    <h3 className="text-[10px] font-black uppercase text-secondary mb-2">Vocab Entities</h3>
                                    <ul className="flex flex-col gap-2">
                                        <li className="flex items-center justify-between p-2 bg-white rounded border border-secondary/20">
                                            <span className="font-black text-sm text-primary-dark">猫 (ねこ)</span>
                                            <button className="text-secondary"><Plus className="w-4 h-4" /></button>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <button onClick={() => setShowAnalysis(false)} className="clay-btn bg-primary py-4 !text-white w-full">Got it!</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Grammar Modal */}
            {showGrammar && selectedData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-lg w-full bg-white p-10 relative animate-in zoom-in-95 duration-200 border-4 border-primary-dark">
                        <button onClick={() => setShowGrammar(false)} className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full text-primary-dark/30"><X className="w-6 h-6" /></button>

                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-secondary rounded-clay border-2 border-primary-dark flex items-center justify-center text-white shadow-clay"><BookOpen className="w-6 h-6" /></div>
                                    <h2 className="text-3xl font-black text-primary-dark">{selectedData.name}</h2>
                                </div>
                                <span className="bg-primary-dark text-white p-2 rounded px-4 font-black">{selectedData.level}</span>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest ml-1">Ý nghĩa & Cách dùng</span>
                                    <div className="p-4 bg-background rounded-clay border-2 border-primary-dark font-bold text-primary-dark/80">
                                        {selectedData.meaning}. Dùng để định nghĩa chủ ngữ đứng trước 'は'.
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest ml-1">Ví dụ khác</span>
                                    <div className="flex flex-col gap-2">
                                        <div className="p-4 bg-white border-2 border-primary-dark rounded-clay shadow-sm hover:-translate-y-1 transition-all">
                                            <p className="font-black text-primary-dark">私は田中です。</p>
                                            <p className="text-[10px] font-bold text-primary-dark/40 mt-1 italic">I am Tanaka.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="clay-btn bg-primary py-4 flex-1">
                                    <Brain className="w-5 h-5" />
                                    Luyện ngay
                                </button>
                                <button className="clay-btn bg-white !text-primary-dark hover:bg-primary/5 px-6 py-4 shadow-none border-dashed border-2">So sánh</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Deck Picker Modal */}
            {showDeckPicker && selectedData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-sm w-full bg-white p-8 relative animate-in zoom-in-95 duration-200 border-4 border-primary-dark">
                        <button onClick={() => setShowDeckPicker(false)} className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full text-primary-dark/30"><X className="w-6 h-6" /></button>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-clay border-2 border-primary flex items-center justify-center text-primary"><Layers className="w-6 h-6" /></div>
                                <h2 className="text-xl font-black text-primary-dark">Thêm vào Deck</h2>
                            </div>

                            <div className="p-6 bg-background rounded-clay border-2 border-primary-dark text-center">
                                <span className="text-3xl font-black text-primary-dark">{selectedData.surface}</span>
                                <div className="text-sm font-bold text-primary-dark/50 mt-1">{selectedData.reading} • {selectedData.meaning}</div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest ml-1">Chọn Deck đích</span>
                                <button className="clay-btn bg-white !text-primary-dark hover:bg-primary/5 py-4 flex justify-between px-6 border-dashed border-2">
                                    <span>Core 2k/6k Japanese</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button className="clay-btn bg-white !text-primary-dark hover:bg-primary/5 py-4 flex justify-between px-6 border-dashed border-2">
                                    <span>Custom Vocabulary</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowDeckPicker(false)}
                                className="clay-btn bg-primary py-4 !text-white flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5 fill-current" />
                                Xác nhận thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

