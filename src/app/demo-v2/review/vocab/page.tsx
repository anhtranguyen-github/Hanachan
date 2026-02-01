'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Brain, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReviewVocab() {
    const router = useRouter();
    const [answer, setAnswer] = React.useState('');
    const [status, setStatus] = React.useState<'idle' | 'correct' | 'wrong'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'idle') {
            router.push('/demo-v2/review/cloze');
            return;
        }

        // Mock verification: "swim" or "bơi"
        if (answer.toLowerCase() === 'swim' || answer === 'bơi') {
            setStatus('correct');
        } else {
            setStatus('wrong');
        }
    };

    return (
        <div className="fixed inset-0 bg-white flex flex-col font-sans text-[#3E4A61] overflow-hidden">
            <header className="h-16 flex items-center justify-between px-8 shrink-0">
                <Link href="/demo-v2/review" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#FFB5B5] transition-colors">
                    <ChevronLeft size={16} />
                    Exit Quiz
                </Link>
            </header>

            <div className="px-12 py-4 space-y-2 shrink-0 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Progress</span>
                    <span className="text-[10px] font-black text-[#3E4A61]">18 / 42</span>
                </div>
                <div className="h-1.5 bg-[#FFF9F9] rounded-full overflow-hidden">
                    <div className="h-full w-[42.8%] bg-[#FFB5B5] rounded-full"></div>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 p-6 overflow-auto">
                <div className="w-full max-w-2xl bg-white border border-[#F0E0E0] rounded-[48px] shadow-2xl shadow-[#FFB5B5]/5 flex flex-col overflow-hidden">
                    {/* Tooltip Instruction */}
                    <div className="py-6 border-b border-[#F7FAFC] flex items-center justify-center gap-3 bg-[#F7FAFC]/30">
                        <Brain size={20} className="text-[#3E4A61]" />
                        <p className="text-sm font-bold text-[#3E4A61]">What is the meaning of this vocabulary?</p>
                    </div>

                    <div className="flex-1 p-10 md:p-14 flex flex-col items-center space-y-12">
                        {/* Item Display Block */}
                        <div className="relative">
                            <div className="w-64 h-32 md:h-40 bg-white border border-[#F0E0E0] rounded-[40px] shadow-xl flex items-center justify-center text-5xl md:text-6xl font-black text-[#FFB5B5] relative z-10 transition-transform">
                                泳ぐ
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-[#4E5A71] tracking-tight uppercase pt-6">What is the Meaning?</h2>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="w-full relative group flex flex-col items-center gap-8">
                            <input
                                type="text"
                                placeholder="答え..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={status !== 'idle'}
                                className={`w-full py-6 md:py-8 bg-white border rounded-[40px] text-center text-4xl font-black outline-none transition-all placeholder:text-[#CBD5E0]/60 shadow-sm ${status === 'idle' ? 'border-[#F0E0E0] focus:border-[#FFB5B5] text-[#3E4A61]' :
                                        status === 'correct' ? 'border-[#48BB78] text-[#48BB78] bg-[#F0FFF4]' :
                                            'border-[#F56565] text-[#F56565] bg-[#FFF5F5]'
                                    }`}
                                autoFocus
                            />

                            <button
                                type="submit"
                                className={`group w-full max-w-sm py-5 rounded-[24px] font-black text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase ${status === 'idle' ? 'bg-[#3E4A61] text-white' :
                                        status === 'correct' ? 'bg-[#48BB78] text-white' :
                                            'bg-[#F56565] text-white'
                                    }`}
                            >
                                {status === 'idle' ? 'Submit Answer' : 'Continue'}
                                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
                <p className="mt-10 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">Press Enter to submit</p>
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
                                <p className={`text-sm font-bold ${status === 'correct' ? 'text-[#48BB78]' : 'text-[#F56565]'
                                    }`}>
                                    {status === 'correct' ? 'Terrific! Your vocabulary is growing.' : 'Keep trying. You will recall it next time.'}
                                </p>
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
