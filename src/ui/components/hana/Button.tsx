
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHana } from "./HanaProvider";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-cocoa disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
    {
        variants: {
            variant: {
                primary: "bg-sakura-pink text-white hover:bg-sakura-rose hover:scale-[1.02]",
                secondary: "bg-sakura-divider text-sakura-cocoa hover:bg-sakura-divider/80 hover:scale-[1.01]",
                outline: "border-2 border-sakura-divider bg-transparent text-sakura-cocoa hover:bg-sakura-divider/10",
                ghost: "text-sakura-cocoa hover:bg-sakura-divider/20",
                danger: "bg-torii-red text-white hover:bg-red-500",
            },
            size: {
                sm: "h-9 px-4 text-[10px] uppercase tracking-widest",
                md: "h-11 px-6",
                lg: "h-14 px-8 text-lg rounded-3xl",
                icon: "h-10 w-10",
            },
            theme: {
                sakura: "",
                night: "border-white/10 text-white hover:bg-white/10",
            }
        },
        compoundVariants: [
            {
                variant: "outline",
                theme: "night",
                className: "border-white/20 text-white hover:bg-white/5",
            },
            {
                variant: "secondary",
                theme: "night",
                className: "bg-white/10 text-white hover:bg-white/20",
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "md",
            theme: "sakura"
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

const HanaButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
        const { theme } = useHana();
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, theme, className }))}
                ref={ref}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading && <Loader2 className="animate-spin" size={18} />}
                {!loading && children}
            </Comp>
        );
    }
);
HanaButton.displayName = "HanaButton";

export { HanaButton, buttonVariants };
