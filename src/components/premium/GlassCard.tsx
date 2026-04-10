
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    hover = true,
    ...props
}) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300",
                hover && "hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer",
                className
            )}
            {...props}
        >
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 p-6">
                {children}
            </div>
        </div>
    );
};
