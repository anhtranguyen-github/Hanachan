import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Removed 'class-variance-authority' to reduce dependencies.
// Implemented simple variant mapping logic.

const buttonBase = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-transparent disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"

const variantsMap = {
  variant: {
    default: "bg-black text-white hover:bg-slate-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border-slate-300 bg-white hover:bg-slate-50 text-black",
    secondary: "bg-slate-200 text-black hover:bg-slate-300",
    ghost: "hover:bg-slate-100 text-black",
    link: "text-black underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10",
  },
} as const

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantsMap.variant
  size?: keyof typeof variantsMap.size
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading = false, disabled, children, ...props }, ref) => {

    // Manual variant resolution
    const variantClass = variantsMap.variant[variant] || variantsMap.variant.default
    const sizeClass = variantsMap.size[size] || variantsMap.size.default

    return (
      <button
        className={cn(buttonBase, variantClass, sizeClass, className)}
        ref={ref}
        disabled={disabled || loading}
        data-state={loading ? "loading" : "idle"}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="button-loader" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
