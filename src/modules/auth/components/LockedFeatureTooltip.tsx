import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { UpgradeModal } from './UpgradeModal';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/lib/ui/tooltip";

interface LockedFeatureTooltipProps {
    children: React.ReactNode;
    isLocked?: boolean;
    label?: string;
    description?: string;
    className?: string; // For wrapper styling
}

export function LockedFeatureTooltip({
    children,
    isLocked,
    label = "Premium Feature",
    description = "This feature requires a premium subscription.",
    className = ""
}: LockedFeatureTooltipProps) {
    const { profile } = useAuth();
    const [showModal, setShowModal] = useState(false);

    // Users and Admins have full access
    const hasAccess = profile?.role === 'USER' || profile?.role === 'ADMIN';
    const locked = isLocked !== undefined ? isLocked : !hasAccess;

    if (!locked) {
        return <>{children}</>;
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <div
                            className={`relative inline-flex opacity-70 cursor-not-allowed group ${className}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowModal(true);
                            }}
                        >
                            {/* Overlay icon */}
                            <div className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-sakura-accent-primary text-white rounded-full flex items-center justify-center ">
                                <Lock size={10} />
                            </div>

                            {/* Disable pointer events on children to prevent clicks */}
                            <div className="pointer-events-none">
                                {children}
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white border-slate-800 p-3 max-w-xs">
                        <div className="font-bold text-xs mb-1 flex items-center gap-1">
                            <Lock size={10} className="text-sakura-accent-primary" />
                            {label}
                        </div>
                        <p className="text-xs text-slate-300">
                            {description} <span className="text-sakura-accent-primary font-bold cursor-pointer">Click to unlock</span>.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}
