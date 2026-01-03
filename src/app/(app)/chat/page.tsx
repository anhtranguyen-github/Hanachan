
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowLeft, Send, Plus, MoreHorizontal, X, Bot, Brain, BookOpen } from 'lucide-react';
import { Button } from '@/ui/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/ui/components/PageHeader';

// --- Types ---
type MessageType = 'text' | 'analysis' | 'quiz';
type MessageRole = 'user' | 'assistant';

interface Message {
    id: string;
    role: MessageRole;
    type: MessageType;
    content: string;
    data?: any; // For flexible payloads (analysis data, quiz state, etc.)
}

// Mock Data for Analysis
const MOCK_ANALYSIS_DATA = {
    sentence: "猫が魚を食べました",
    meaning: "The cat ate the fish.",
    tokens: [
        { surface: "猫", reading: "ねこ", type: "Noun" },
        { surface: "が", reading: "ga", type: "Particle" },
        { surface: "魚", reading: "さかな", type: "Noun" },
        { surface: "を", reading: "o", type: "Particle" },
        { surface: "食べました", reading: "たべました", type: "Verb" },
    ],
    grammar: [
        { title: "Particle が", level: "N5", desc: "Subject marker." },
        { title: "Verb (Polite Past)", level: "N5", desc: "Masu-form past tense." }
    ]
};

// Mock Quiz Data
const MOCK_QUIZ_QUESTION = {
    question: "Select the correct particle: 私は寿司__好きです。",
    options: ["が", "を", "に", "で"],
    answer: "が",
    explanation: "好き (suki) usually takes が (ga) to mark the object of affection."
};

export default function ChatPage() {
    // State
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', type: 'text', content: "Hello! I'm Hana. I can analyze Japanese sentences, verify grammar, or quiz you. Try saying 'hello' or typing a Japanese sentence!" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [quizMode, setQuizMode] = useState(false);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [selectedCardItem, setSelectedCardItem] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // --- Core Logic ---

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        setInputValue('');

        // 1. User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', type: 'text', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // 2. Intent Routing & Delay
        setTimeout(() => {
            handleBotResponse(userText);
        }, 600);
    };

    const handleBotResponse = (text: string) => {
        setIsTyping(false);
        let botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', type: 'text', content: '' };

        const lowerText = text.toLowerCase();
        const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);

        // --- QUIZ FLOW ---
        if (quizMode) {
            // Evaluates answer mock
            if (text.includes(MOCK_QUIZ_QUESTION.answer)) {
                botMsg.content = `✅ Correct! ${MOCK_QUIZ_QUESTION.explanation}`;
            } else {
                botMsg.content = `❌ Incorrect. The correct answer was ${MOCK_QUIZ_QUESTION.answer}. ${MOCK_QUIZ_QUESTION.explanation}`;
            }
            setQuizMode(false); // Exit quiz mode after one question for this demo
            setMessages(prev => [...prev, botMsg]);
            return;
        }

        // --- INTENT ROUTING ---

        // 1. Quiz Intent
        if (lowerText.includes('quiz') || lowerText.includes('test me')) {
            setQuizMode(true);
            botMsg.type = 'quiz';
            botMsg.content = "Time for a quick quiz!";
            botMsg.data = MOCK_QUIZ_QUESTION;
        }
        // 2. Save/Add Intent
        else if (lowerText.includes('save') || lowerText.includes('add') || lowerText.includes('lưu')) {
            // Trigger Save Modal Flow via a special message or just direct action
            botMsg.content = "I've opened the card creation tool for you.";
            openAddCardModal({ surface: "Mock Word", reading: "mock", meaning: "Triggered via Chat" });
        }
        // 3. Analyze Intent (Explicit or Detect JP)
        else if (lowerText.includes('analyze') || lowerText.includes('phân tích') || hasJapanese) {
            botMsg.type = 'analysis';
            botMsg.content = "Here is the breakdown of your sentence:";
            botMsg.data = { ...MOCK_ANALYSIS_DATA, sentence: text }; // Echo back user sentence mock
        }
        // 4. Greeting
        else if (lowerText.match(/^(hi|hello|hey|chào)/)) {
            botMsg.content = "Hello there! Ready to study Japanese? 🇯🇵";
        }
        // 5. Fallback
        else {
            botMsg.content = "I'm not sure specifically, but I can help you analyze Japanese or run a quiz. Try typing a Japanese sentence!";
        }

        setMessages(prev => [...prev, botMsg]);
    };

    const openAddCardModal = (item: any) => {
        setSelectedCardItem(item);
        setShowAddCardModal(true);
    };

    const handleConfirmAddCard = () => {
        setShowAddCardModal(false);
        // Mock Toast
        const confirmMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            type: 'text',
            content: `Saved "<strong>${selectedCardItem?.surface}</strong>" to your <strong>Vocabulary</strong> deck.`
        };
        setMessages(prev => [...prev, confirmMsg]);
    };


    return (
        <div className="flex h-[calc(100vh-64px)] gap-6 max-w-7xl mx-auto w-full">

            {/* Sidebar (Mock) */}
            <div className="w-[280px] hidden md:flex flex-col gap-4 py-4">
                <Button className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold gap-2">
                    <Plus size={16} /> New Chat
                </Button>
                <div className="bg-white rounded-2xl flex-1 border border-slate-100 p-4 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recent</div>
                    <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold cursor-pointer">Current Session</div>
                    <div className="p-3 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium cursor-pointer">Grammar N4 Help</div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden my-4">

                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-400 rounded-lg flex items-center justify-center text-white shadow-sm">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">Hana AI</div>
                            <div className="text-[10px] font-bold text-green-500 uppercase tracking-wide flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* Avatar (Bot only) */}
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-1">
                                    <Bot size={16} />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={cn(
                                "max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-rose-500 text-white rounded-tr-none"
                                    : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                            )}>
                                {/* Text Content */}
                                <div dangerouslySetInnerHTML={{ __html: msg.content }} />

                                {/* --- RENDER SPECIAL CARDS --- */}

                                {/* Analysis Card */}
                                {msg.type === 'analysis' && msg.data && (
                                    <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-200">
                                            <div className="text-lg font-black text-slate-800">{msg.data.sentence}</div>
                                            <div className="text-xs text-slate-500 italic mt-1">{msg.data.meaning}</div>
                                        </div>

                                        {/* Tokens */}
                                        <div className="p-4 flex flex-wrap gap-2">
                                            {msg.data.tokens.map((t: any, i: number) => (
                                                <div
                                                    key={i}
                                                    onClick={() => openAddCardModal(t)}
                                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <div className="text-[9px] text-slate-400 text-center">{t.reading}</div>
                                                    <div>{t.surface}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Grammar */}
                                        <div className="bg-white p-2 space-y-2">
                                            {msg.data.grammar.map((g: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                    <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded">{g.level}</span>
                                                    <div className="flex-1">
                                                        <div className="text-xs font-bold text-slate-800">{g.title}</div>
                                                        <div className="text-[10px] text-slate-500">{g.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-2 bg-slate-100 text-center">
                                            <button className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1 w-full" onClick={() => openAddCardModal({ surface: msg.data.sentence, reading: '', meaning: msg.data.meaning })}>
                                                <Plus size={12} /> Save Sentence
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Quiz Card */}
                                {msg.type === 'quiz' && msg.data && (
                                    <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden p-4">
                                        <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold text-xs uppercase tracking-widest">
                                            <Brain size={14} /> Quick Quiz
                                        </div>
                                        <div className="font-bold text-slate-800 mb-4 text-sm">{msg.data.question}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {msg.data.options.map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => !isTyping && handleSendLogic(opt)}
                                                    // HACK: direct send to simulate reply
                                                    className="py-2 bg-white border border-indigo-200 rounded-lg text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-colors"
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-4 justify-start">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-1">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 rounded-tl-none">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="relative">
                        <input
                            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 font-medium text-slate-700 disabled:opacity-50"
                            placeholder={quizMode ? "Type your answer..." : "Ask Hana... (Try: 'analyze [sentence]', 'quiz me')"}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isTyping}
                        />
                        <button
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

            </div>

            {/* Add Card Modal Mock */}
            {showAddCardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in">
                    <div className="bg-white w-[400px] rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">Add to Flashcards</h3>
                            <button onClick={() => setShowAddCardModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Front (Japanese)</label>
                                <div className="p-3 bg-slate-50 rounded-xl font-bold text-slate-800 text-lg">{selectedCardItem?.surface}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Back (Meaning)</label>
                                <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800">{selectedCardItem?.meaning || '...'}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Tags</label>
                                <div className="flex gap-2 mt-2">
                                    <span className="px-2 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded">Vocab</span>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded border border-slate-200">+ Add Tag</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowAddCardModal(false)}>Cancel</Button>
                            <Button className="flex-1 btn-primary" onClick={handleConfirmAddCard}>Save Card</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );

    // Helper to allow Quiz option buttons to send messages
    function handleSendLogic(text: string) {
        // Need to duplicate logic slightly or expose handleSend, but simpler to just set state and call logic
        // We can't easily call handleSend because it relies on inputValue state. 
        // Let's modify handleSend to accept optional text override.
        // Actually, re-implementation inline for the options:
        const userMsg: Message = { id: Date.now().toString(), role: 'user', type: 'text', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setTimeout(() => handleBotResponse(text), 600);
    }
}
