
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReviewRating } from '../types'

interface SRSButtonGroupProps {
    onRate: (rating: ReviewRating) => void;
    disabled?: boolean;
}

const buttons: { rating: ReviewRating; label: string; color: string; desc: string }[] = [
    { rating: 1, label: 'Again', color: 'bg-red-500/20 text-red-500 border-red-500/50', desc: '< 10m' },
    { rating: 2, label: 'Hard', color: 'bg-orange-500/20 text-orange-500 border-orange-500/50', desc: '2d' },
    { rating: 3, label: 'Good', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50', desc: '4d' },
    { rating: 4, label: 'Easy', color: 'bg-blue-500/20 text-blue-500 border-blue-500/50', desc: '7d' },
]

export const SRSButtonGroup: React.FC<SRSButtonGroupProps> = ({ onRate, disabled }) => {
    return (
        <div className="grid grid-cols-4 gap-3 w-full max-w-md">
            {buttons.map((btn) => (
                <motion.button
                    key={btn.rating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={disabled}
                    onClick={() => onRate(btn.rating)}
                    className={cn(
                        "flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300",
                        btn.color,
                        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-30 shadow-lg hover:shadow-xl"
                    )}
                >
                    <span className="font-bold text-sm tracking-tight">{btn.label}</span>
                    <span className="text-[10px] mt-1 opacity-60 font-medium">{btn.desc}</span>
                </motion.button>
            ))}
        </div>
    )
}

export default SRSButtonGroup
