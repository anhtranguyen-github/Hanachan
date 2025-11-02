'use client';

import React from 'react';
import { X, Zap, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, reason }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-sakura-bg-app/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden border border-sakura-divider/50 animate-in zoom-in-95 duration-500">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 rounded-full bg-sakura-bg-soft text-sakura-text-muted hover:text-sakura-accent-primary transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left: Visual/Pricing */}
                    <div className="bg-sakura-accent-muted p-12 flex flex-col justify-center items-start gap-6">
                        <div className="p-4 bg-white rounded-3xl text-sakura-accent-primary ">
                            <Zap size={40} fill="currentColor" />
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-sakura-accent-primary">Premium Plan</div>
                            <h2 className="text-4xl font-black text-sakura-text-primary leading-none">Unlimit Your Learning.</h2>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-sakura-text-primary">$9.99</span>
                            <span className="text-sm font-bold text-sakura-text-muted">/ month</span>
                        </div>
                    </div>

                    {/* Right: Benefits & Action */}
                    <div className="p-12 space-y-8">
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-sakura-text-secondary italic">
                                {reason || "You've reached your monthly limit of AI calls. Upgrade to keep using advanced analysis tools."}
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "100 AI Analysis calls / month",
                                    "Unlimited Custom Decks",
                                    "Advanced SRS Insights",
                                    "Interactive Reading Tools",
                                    "Priority Support"
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span className="text-xs font-bold text-sakura-text-primary">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button className="w-full flex items-center justify-center gap-3 py-5 bg-sakura-accent-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all ">
                                Upgrade Now
                                <ArrowRight size={18} strokeWidth={3} />
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 text-sakura-text-muted font-bold text-[10px] uppercase tracking-widest hover:text-sakura-text-primary transition-colors"
                            >
                                Not now, I&apos;ll wait until next month
                            </button>
                        </div>
                    </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sakura-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-sakura-accent-secondary/5 rounded-full blur-2xl pointer-events-none" />
            </div>
        </div>
    );
};
