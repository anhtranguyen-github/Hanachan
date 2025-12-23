
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface HanaElementProps extends React.HTMLAttributes<HTMLElement> {
    as?: React.ElementType;
    elevation?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
}

/**
 * HanaElement: The base "Web Component-like" wrapper for all Hana UI.
 * Provides consistent elevation, transitions, and encapsulation rules.
 */
export const HanaElement = React.forwardRef<HTMLElement, HanaElementProps>(
    ({ as: Component = 'div', className, elevation = 'none', interactive = false, ...props }, ref) => {
        const elevationStyles = {
            none: '',
            sm: 'border border-sakura-divider',
            md: 'border-2 border-sakura-divider shadow-sm',
            lg: 'border-2 border-sakura-divider shadow-md',
        };

        const interactiveStyles = interactive
            ? 'transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
            : '';

        return (
            <Component
                ref={ref}
                className={cn(
                    "rounded-2xl bg-white text-sakura-ink",
                    elevationStyles[elevation],
                    interactiveStyles,
                    className
                )}
                {...props}
            />
        );
    }
);

HanaElement.displayName = "HanaElement";
