'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card - Base card component for dashboard widgets.
 * 
 * Variants:
 * - default: Standard card with border
 * - elevated: Card with shadow
 * - action: Card with hover effect for clickable cards
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'action';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
    default: 'bg-card border border-border/30',
    elevated: 'bg-card ',
    action: 'bg-card border border-border/30 hover:border-primary/30 hover: transition-all cursor-pointer',
};

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
};

export function Card({
    variant = 'default',
    padding = 'md',
    className,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl overflow-hidden',
                variantStyles[variant],
                paddingStyles[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * CardHeader - Header section of a card
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    iconBg?: string;
    title: string;
    subtitle?: string;
    badge?: string | number;
    badgeColor?: string;
    rightContent?: React.ReactNode;
}

export function CardHeader({
    icon,
    iconBg = 'bg-primary/10',
    title,
    subtitle,
    badge,
    badgeColor = 'bg-muted text-foreground/70',
    rightContent,
    className,
    ...props
}: CardHeaderProps) {
    return (
        <div className={cn('flex items-center justify-between', className)} {...props}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={cn('p-2.5 rounded-xl', iconBg)}>
                        {icon}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-foreground tracking-tight">{title}</h3>
                        {badge !== undefined && (
                            <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-bold',
                                badgeColor
                            )}>
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-foreground/60 font-medium mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {rightContent && (
                <div>{rightContent}</div>
            )}
        </div>
    );
}

/**
 * CardContent - Main content area of a card
 */
export function CardContent({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('mt-4', className)} {...props}>
            {children}
        </div>
    );
}

/**
 * CardFooter - Footer section with actions
 */
export function CardFooter({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-border/20', className)} {...props}>
            {children}
        </div>
    );
}

export default Card;
