
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

const HanaInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, label, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-bold text-sakura-cocoa px-1">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-2xl border-2 border-sakura-divider bg-white px-4 py-2 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-sakura-cocoa/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-pink disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-torii-red focus-visible:ring-torii-red",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-xs font-bold text-torii-red px-1 animate-fadeIn">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
HanaInput.displayName = "HanaInput";

export { HanaInput };
