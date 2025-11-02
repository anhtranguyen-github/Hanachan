
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashcardProps {
    ku: {
        slug: string;
        type: string;
        search_key: string;
    };
    front: React.ReactNode;
    back: React.ReactNode;
    isFlipped: boolean;
    onFlip: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ ku, front, back, isFlipped, onFlip }) => {
    return (
        <div className="relative w-full max-w-md aspect-[3/4] perspective-1000 cursor-pointer" onClick={onFlip}>
            <motion.div
                className="relative w-full h-full transition-all duration-500 preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                {/* Front Side */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full backface-hidden rounded-3xl p-8 flex flex-col items-center justify-center bg-gradient-to-br border border-white/10 shadow-2xl overflow-hidden",
                        ku.type === 'kanji' ? "from-indigo-600/20 to-purple-600/20" :
                            ku.type === 'vocabulary' ? "from-emerald-600/20 to-teal-600/20" :
                                "from-blue-600/20 to-cyan-600/20"
                    )}
                >
                    <div className="absolute top-6 left-6 flex items-center gap-2 opacity-50">
                        <span className="text-xs font-bold tracking-widest uppercase">{ku.type}</span>
                    </div>

                    <div className="text-8xl font-bold text-white drop-shadow-glow">
                        {ku.search_key}
                    </div>

                    <div className="absolute bottom-10 text-sm italic text-white/40 flex items-center gap-2 animate-pulse">
                        <Info size={14} /> Tap to flip
                    </div>
                </div>

                {/* Back Side */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full backface-hidden rounded-3xl p-8 flex flex-col items-center justify-center bg-zinc-900 border border-white/5 shadow-2xl rotate-y-180 overflow-y-auto",
                    )}
                >
                    <div className="w-full text-center space-y-6">
                        {back}
                    </div>

                    <div className="absolute bottom-6 flex gap-4 opacity-30">
                        <Volume2 size={20} className="hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default Flashcard
