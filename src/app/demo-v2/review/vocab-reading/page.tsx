'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Brain, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReviewVocabReading() {
    const router = useRouter();
    const [answer, setAnswer] = React.useState('');
    const [status, setStatus] = React.useState<'idle' | 'correct' | 'wrong'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'idle') {
            router.push('/demo-v2/review/cloze');
            return;
        }

        // Mock verification for "oyogu" (Reading of 泳ぐ)
        if (answer.toLowerCase() === 'oyogu' || answer === 'およぐ') {
            setStatus('correct');
        } else {
            setStatus('wrong');
        }
    };

    return (
        <div className="fixed inset-0 bg-[#FFFFFF] flex flex-col font-sans text-[#3E4A61] overflow-hidden">
            <header className="h-20 flex items-center justify-between px-10 shrink-0">
                <Link href="/demo-v2/review" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#FFB5B5] transition-colors text-[#3E4A61]">
                    <ChevronLeft size={16} />
                    Exit Quiz
                </Link>
                <button className="w-12 h-12 bg-white border-2 border-gray-50 shadow-sm rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                    <CheckCircle2 size={24} className="opacity-0" /> {/* Spacer */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-1 bg-gray-300 rotate-45 rounded-full absolute"></div>
                        <div className="w-6 h-1 bg-gray-300 -rotate-45 rounded-full absolute"></div>
                    </div>
                </button>
            </header>

            <div className="px-14 py-2 space-y-2 shrink-0 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61] opacity-60">Progress</span>
                    <span className="text-[10px] font-black text-[#3E4A61] opacity-60">18 / 42</span>
                </div>
                <div className="h-1.5 bg-[#FFF9F9] rounded-full overflow-hidden border border-[#FEE2E2]">
                    <div className="h-full w-[42%] bg-[#FFB5B5] rounded-full"></div>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-2xl bg-white border-2 border-[#F0E0E0] rounded-[64px] shadow-2xl shadow-[#FFB5B5]/10 flex flex-col overflow-hidden">
                    {/* Tooltip Instruction */}
                    <div className="py-8 border-b border-[#F7FAFC] flex items-center justify-center gap-3 bg-[#F7FAFC]/30">
                        <Brain size={20} className="text-[#3E4A61]" />
                        <p className="text-sm font-bold text-[#3E4A61] tracking-tight">What is the reading of this vocabulary?</p>
                    </div>

                    <div className="p-8 md:p-10 flex flex-col items-center space-y-8">
                        {/* Item Display Block */}
                        <div className="w-60 h-32 bg-white border border-[#F0E0E0] rounded-[40px] shadow-xl flex flex-col items-center justify-center relative transition-transform">
                            <span className="text-5xl md:text-6xl font-black text-[#FFB5B5]">泳ぐ</span>
                            <span className="text-xs font-bold text-[#A0AEC0] mt-1 italic">To swim</span>
                        </div>

                        <h2 className="text-3xl font-black text-[#3E4A61] tracking-tight uppercase">What is the Reading?</h2>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center gap-8">
                            <div className="w-full">
                                <input
                                    type="text"
                                    placeholder="答え..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={status !== 'idle'}
                                    className={`w-full py-6 bg-white border-2 rounded-[24px] text-center text-4xl font-black outline-none transition-all placeholder:text-[#CBD5E0]/40 ${status === 'idle' ? 'border-[#FEE2E2] focus:border-[#FFB5B5] text-[#3E4A61]' :
                                        status === 'correct' ? 'border-[#48BB78] text-[#48BB78] bg-[#F0FFF4]' :
                                            'border-[#F56565] text-[#F56565] bg-[#FFF5F5]'
                                        }`}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className={`group w-full py-5 rounded-[24px] font-black text-[10px] tracking-[0.25em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] uppercase shadow-lg ${status === 'idle' ? 'bg-[#3E4A61] text-white hover:bg-[#2D3748]' :
                                    status === 'correct' ? 'bg-[#48BB78] text-white' :
                                        'bg-[#F56565] text-white'
                                    }`}
                            >
                                {status === 'idle' ? 'Submit Answer' : 'Continue'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
                <p className="mt-12 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.3em] opacity-60">Press Enter to submit</p>
            </main>

            {/* Feedback Tray */}
            {status !== 'idle' && (
                <div className={`fixed bottom-0 left-0 right-0 p-8 transform transition-transform animate-in slide-in-from-bottom duration-300 ${status === 'correct' ? 'bg-[#F0FFF4] border-t-2 border-[#48BB78]' : 'bg-[#FFF5F5] border-t-2 border-[#F56565]'
                    }`}>
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${status === 'correct' ? 'bg-[#48BB78]/10 text-[#48BB78]' : 'bg-[#F56565]/10 text-[#F56565]'
                                }`}>
                                {status === 'correct' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                            </div>
                            <div className="space-y-1">
                                <h3 className={`text-2xl font-black uppercase tracking-tight ${status === 'correct' ? 'text-[#2F855A]' : 'text-[#C53030]'
                                    }`}>
                                    {status === 'correct' ? 'Correct!' : 'Incorrect'}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-black ${status === 'correct' ? 'text-[#2F855A]' : 'text-[#C53030]'}`}>およぐ</span>
                                    <span className="text-sm font-bold opacity-60">(oyogu)</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/demo-v2/review/cloze')}
                            className="px-10 py-5 bg-[#3E4A61] text-white rounded-[24px] font-black text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-all uppercase"
                        >
                            Next Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
