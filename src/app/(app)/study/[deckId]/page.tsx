'use client';

import React, { useState } from 'react';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, Play, Volume2, Trophy, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudyPage() {
    const router = useRouter();
    const [cardIndex, setCardIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    const TOTAL_CARDS = 10;

    // Mock Card Data (Repeating pattern for demo)
    const currentCard = {
        front: cardIndex % 2 === 0 ? "私は毎日日本語を勉強しています。" : "猫",
        reading: cardIndex % 2 === 0 ? "べんきょうべんきょう" : "ねこ",
        back: cardIndex % 2 === 0 ? "I study Japanese every day." : "Cat",
        type: cardIndex % 2 === 0 ? "Sentence" : "Vocabulary"
    };

    const handleGrade = () => {
        if (cardIndex < TOTAL_CARDS - 1) {
            setCardIndex(prev => prev + 1);
            setIsRevealed(false);
        } else {
            setSessionComplete(true);
        }
    };

    if (sessionComplete) {
        return (
            <div className="max-w-md mx-auto h-[calc(100vh-100px)] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 mb-6 shadow-sm">
                    <Trophy size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h1>
                <p className="text-slate-500 font-medium mb-8">You reviewed {TOTAL_CARDS} cards.</p>

                <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-600">Accuracy</span>
                        <span className="font-black text-emerald-500">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-600">XP Earned</span>
                        <span className="font-black text-rose-500">+150 XP</span>
                    </div>
                </div>

                <div className="flex w-full gap-4">
                    <Button variant="outline" className="flex-1 h-12 font-bold border-slate-200" onClick={() => router.push('/dashboard')}>
                        Stats
                    </Button>
                    <Button className="flex-1 h-12 btn-primary font-bold" onClick={() => { setSessionComplete(false); setCardIndex(0); setIsRevealed(false); }}>
                        <RotateCcw className="mr-2" size={16} /> Review Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col items-center justify-center">

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 px-4">
                <Button variant="ghost" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-800" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> End Session
                </Button>
                <div className="flex items-center gap-4">
                    <span className="text-slate-300 text-xs font-mono">{cardIndex + 1} / {TOTAL_CARDS}</span>
                    <span className="font-black text-xs uppercase tracking-widest text-slate-800">{cardIndex} Done</span>
                </div>
            </div>

            {/* Main Card */}
            <div className="app-card w-full max-w-2xl aspect-[4/3] flex flex-col items-center justify-center p-12 relative shadow-lg shadow-rose-100/50 mb-10 transition-all duration-300" key={cardIndex}>

                <button className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-100 hover:scale-105 transition-all absolute top-12">
                    <Volume2 fill="currentColor" size={20} />
                </button>

                <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="text-sm font-bold text-slate-400">{currentCard.reading}</div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 font-jp tracking-wider text-center">
                        {currentCard.front}
                    </h1>
                </div>

                {isRevealed && (
                    <div className="w-full p-6 bg-rose-50 rounded-2xl text-center animate-in slide-in-from-bottom-2">
                        <p className="text-rose-900 font-medium font-jp text-lg">{currentCard.back}</p>
                    </div>
                )}
            </div>

            {/* SRS Controls */}
            {!isRevealed ? (
                <Button
                    className="w-full max-w-sm h-14 rounded-full bg-blue-50 text-blue-600 font-bold tracking-widest hover:bg-blue-100 hover:scale-[1.02] transition-all shadow-lg shadow-blue-100"
                    onClick={() => setIsRevealed(true)}
                >
                    SHOW ANSWER
                </Button>
            ) : (
                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
                    <button onClick={handleGrade} className="btn-srs-again flex flex-col items-center justify-center py-4 rounded-2xl transition-transform active:scale-95">
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1">Again</span>
                        <span className="text-[10px] opacity-60">&lt;1m</span>
                    </button>
                    <button onClick={handleGrade} className="btn-srs-hard flex flex-col items-center justify-center py-4 rounded-2xl transition-transform active:scale-95">
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1">Hard</span>
                        <span className="text-[10px] opacity-60">2d</span>
                    </button>
                    <button onClick={handleGrade} className="btn-srs-medium flex flex-col items-center justify-center py-4 rounded-2xl transition-transform active:scale-95">
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1">Medium</span>
                        <span className="text-[10px] opacity-60">4d</span>
                    </button>
                    <button onClick={handleGrade} className="btn-srs-easy flex flex-col items-center justify-center py-4 rounded-2xl transition-transform active:scale-95">
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1">Easy</span>
                        <span className="text-[10px] opacity-60">7d</span>
                    </button>
                </div>
            )}
        </div>
    );
}
