"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2 } from 'lucide-react';

export type SakuraButtonVariant =
    | 'primary'      // Deep Cocoa - Main CTA
    | 'secondary'    // White Shell - Secondary action
    | 'radical'      // Teal - Content type
    | 'kanji'        // Emerald - Content type
    | 'vocabulary'   // Blue - Content type
    | 'grammar'      // Amber - Content type
    | 'danger'       // Red - Destructive
    | 'success'      // Green - Positive
    | 'info'         // Cyan - Informational
    | 'warning'      // Orange - Warning
    | 'ghost'        // Transparent - Subtle
    | 'outline';     // Border only - Minimal

interface SakuraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: SakuraButtonVariant;
    icon?: LucideIcon;
    iconRight?: LucideIcon;
    isLoading?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * SAKURA BUTTON V2 - SEMANTIC COLOR HIERARCHY
 * 
 * TIER 1 - ACTIONS (High Priority):
 * - primary: Deep Cocoa (#4A3728) - Main CTA
 * - success: Emerald - Positive confirmations
 * - danger: Rose Red - Destructive actions
 * 
 * TIER 2 - CONTENT TYPES (Semantic):
 * - radical: Saturated Teal (#0D9488)
 * - kanji: Saturated Emerald (#059669)
 * - vocabulary: Saturated Blue (#2563EB)
 * - grammar: Saturated Amber (#D97706)
 * 
 * TIER 3 - UTILITY (Low Priority):
 * - secondary: White with border
 * - ghost: Transparent
 * - outline: Border only
 * - info: Cyan
 * - warning: Orange
 */
export function SakuraButton({
    className,
    variant = 'primary',
    icon: Icon,
    iconRight: IconRight,
    children,
    isLoading,
    size = 'md',
    ...props
}: SakuraButtonProps) {

    // TIER 1: Action buttons - High visual hierarchy
    // TIER 2: Content type buttons - Semantic colors
    // TIER 3: Utility buttons - Low visual hierarchy

    const variants = {
        // TIER 1: Actions
        primary: cn(
            "bg-[#4A3728] text-white border-[#3A2A1D]",
            "hover:bg-[#5A4738] hover:border-[#4A3728] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4A3728]/20",
            "focus-visible:ring-2 focus-visible:ring-[#4A3728]/50 focus-visible:ring-offset-2"
        ),
        success: cn(
            "bg-emerald-600 text-white border-emerald-700",
            "hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25",
            "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2"
        ),
        danger: cn(
            "bg-rose-600 text-white border-rose-700",
            "hover:bg-rose-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/25",
            "focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2"
        ),

        // TIER 2: Content Types (Semantic)
        radical: cn(
            "bg-[#0D9488] text-white border-[#0F766E]",
            "hover:bg-[#14B8A6] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/25",
            "focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2"
        ),
        kanji: cn(
            "bg-[#059669] text-white border-[#047857]",
            "hover:bg-[#10B981] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25",
            "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2"
        ),
        vocabulary: cn(
            "bg-[#2563EB] text-white border-[#1D4ED8]",
            "hover:bg-[#3B82F6] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25",
            "focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2"
        ),
        grammar: cn(
            "bg-[#D97706] text-white border-[#B45309]",
            "hover:bg-[#F59E0B] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25",
            "focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2"
        ),

        // TIER 3: Utility
        secondary: cn(
            "bg-white text-[#4A3728] border-sakura-divider",
            "hover:bg-sakura-bg-app hover:border-[#4A3728]/30 hover:-translate-y-0.5",
            "focus-visible:ring-2 focus-visible:ring-[#4A3728]/30 focus-visible:ring-offset-2"
        ),
        ghost: cn(
            "bg-transparent text-[#4A3728]/70 border-transparent",
            "hover:bg-[#4A3728]/5 hover:text-[#4A3728]",
            "focus-visible:ring-2 focus-visible:ring-[#4A3728]/20 focus-visible:ring-offset-2"
        ),
        outline: cn(
            "bg-transparent text-[#4A3728] border-[#4A3728]/30",
            "hover:bg-[#4A3728]/5 hover:border-[#4A3728]/50 hover:-translate-y-0.5",
            "focus-visible:ring-2 focus-visible:ring-[#4A3728]/30 focus-visible:ring-offset-2"
        ),
        info: cn(
            "bg-cyan-600 text-white border-cyan-700",
            "hover:bg-cyan-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/25",
            "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2"
        ),
        warning: cn(
            "bg-orange-500 text-white border-orange-600",
            "hover:bg-orange-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25",
            "focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2"
        ),
    };

    const sizes = {
        xs: "px-3 py-1.5 text-[8px] gap-1.5",
        sm: "px-4 py-2 text-[9px] gap-2",
        md: "px-6 py-2.5 text-[10px] gap-2.5",
        lg: "px-10 py-4 text-xs gap-3"
    };

    const iconSizes = {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18
    };

    const isGhostOrOutline = variant === 'ghost' || variant === 'outline' || variant === 'secondary';

    return (
        <button
            className={cn(
                "relative inline-flex items-center justify-center font-black uppercase tracking-widest",
                "transition-all duration-200 ease-out",
                "active:scale-[0.97] active:translate-y-0",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                "rounded-xl border border-b-[3px]",
                "outline-none",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <Loader2 size={iconSizes[size]} className="animate-spin" />
            ) : (
                Icon && (
                    <Icon
                        size={iconSizes[size]}
                        className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            isGhostOrOutline ? "text-current" : "text-white/90"
                        )}
                    />
                )
            )}
            {children && <span>{children}</span>}
            {!isLoading && IconRight && (
                <IconRight
                    size={iconSizes[size]}
                    className={cn(
                        "transition-transform duration-200 group-hover:translate-x-0.5",
                        isGhostOrOutline ? "text-current" : "text-white/90"
                    )}
                />
            )}
        </button>
    );
}
