'use client';

import React, { useEffect, useState } from 'react';
import {
    AlertCircle,
    Clock,
    Layers,
    Wind,
    BookOpen,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { useReadiness } from '@/modules/learning/hooks/useSrsData';

interface ReadinessResponse {
    state: string;
    title: string;
    description: string;
    suggestedActions: Array<{
        type: 'primary' | 'secondary';
        label: string;
        href: string;
    }>;
}

const STATE_ICONS: Record<string, any> = {
    OVERDUE_REVIEW: AlertCircle,
    REVIEW_HEAVY: Layers,
    COOL_DOWN_RECOMMENDED: Wind,
    GRAMMAR_CONSOLIDATION: BookOpen,
    READY_FOR_LESSONS: Sparkles,
    BALANCED: CheckCircle2
};

const STATE_COLORS: Record<string, string> = {
    OVERDUE_REVIEW: 'bg-red-50 text-red-600 border-red-100',
    REVIEW_HEAVY: 'bg-orange-50 text-orange-600 border-orange-100',
    COOL_DOWN_RECOMMENDED: 'bg-blue-50 text-blue-600 border-blue-100',
    GRAMMAR_CONSOLIDATION: 'bg-sakura-bg-soft text-sakura-accent-primary border-sakura-divider',
    READY_FOR_LESSONS: 'bg-green-50 text-green-600 border-green-100',
    BALANCED: 'bg-indigo-50 text-indigo-600 border-indigo-100'
};

export function ReadinessCard() {
    const { data, isLoading } = useReadiness();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check session storage for dismissal
        const dismissed = sessionStorage.getItem('readiness_dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
            return;
        }

        if (data && !isLoading) {
            setIsVisible(true);
        }
    }, [data, isLoading]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('readiness_dismissed', 'true');
        setTimeout(() => setIsDismissed(true), 500); // Wait for animation
    };

    if (isDismissed || !data) return null;

    const Icon = STATE_ICONS[data.state] || CheckCircle2;
    const colorClass = STATE_COLORS[data.state] || STATE_COLORS.BALANCED;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                >
                    <div className={cn(
                        "relative p-6 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row items-center gap-6",
                        colorClass
                    )}>
                        {/* Dismiss Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>

                        {/* Icon Section */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm  flex items-center justify-center">
                            <Icon size={28} />
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 text-center md:text-left space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Today&apos;s Guidance</span>
                                <div className="h-1 w-1 rounded-full bg-current opacity-30" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{data.state.replace(/_/g, ' ')}</span>
                            </div>
                            <h3 className="text-xl font-black tracking-tight">{data.title}</h3>
                            <p className="text-sm font-medium opacity-80 leading-relaxed max-w-2xl">
                                {data.description}
                            </p>
                        </div>

                        {/* Actions Section */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {data.suggestedActions.map((action, idx) => (
                                <Link
                                    key={idx}
                                    href={action.href}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95",
                                        action.type === 'primary'
                                            ? "bg-white text-sakura-text-primary  hover: hover:-translate-y-0.5"
                                            : "border border-current opacity-60 hover:opacity-100 hover:bg-white/10"
                                    )}
                                >
                                    {action.label}
                                    {action.type === 'primary' && <ArrowRight size={14} />}
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
