
import * as React from "react";
import { cn } from "@/lib/utils";

interface HanaCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'flat' | 'clay' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const HanaCard = React.forwardRef<HTMLDivElement, HanaCardProps>(
    ({ className, variant = 'flat', padding = 'md', ...props }, ref) => {
        const paddingStyles = {
            none: 'p-0',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-10',
        };

        const variantStyles = {
            flat: 'bg-white border border-sakura-divider',
            clay: 'bg-white border-2 border-sakura-divider rounded-clay',
            elevated: 'bg-white border border-sakura-divider hover:scale-[1.01] transition-transform', // "No Shadow Policy" implies no real shadows, using scale for depth
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-3xl",
                    variantStyles[variant],
                    paddingStyles[padding],
                    className
                )}
                {...props}
            />
        );
    }
);
HanaCard.displayName = "HanaCard";

export { HanaCard };
