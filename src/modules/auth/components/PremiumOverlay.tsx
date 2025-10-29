import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { UpgradeModal } from './UpgradeModal';

interface PremiumOverlayProps {
    children: React.ReactNode;
    isLocked?: boolean; // Override lock status (e.g. for specific content)
    title?: string;
    description?: string;
}

export function PremiumOverlay({
    children,
    isLocked,
    title = "Premium Feature",
    description = "Upgrade to unlock detailed analytics and advanced tools."
}: PremiumOverlayProps) {
    const { profile } = useAuth();
    const [showModal, setShowModal] = useState(false);

    // Determine lock status:
    // 1. If explicitly passed prop 'isLocked' is provided, use that.
    // 2. Otherwise, check user role. (ADMIN/USER bypass lock)
    const hasAccess = profile?.role === 'USER' || profile?.role === 'ADMIN';
    const locked = isLocked !== undefined ? isLocked : !hasAccess;

    // If unlocked, render children normally
    if (!locked) {
        return <>{children}</>;
    }

    return (
        <div className="relative group overflow-hidden rounded-2xl">
            {/* The blurred content */}
            <div className="filter blur-md pointer-events-none select-none opacity-50 transition-all duration-500">
                {children}
            </div>

            {/* The Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-sm p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-2xl max-w-sm border border-white/20"
                >
                    <div className="w-12 h-12 bg-sakura-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-sakura-accent-primary">
                        <Lock size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        {description}
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-2.5 bg-sakura-accent-primary text-white font-bold rounded-xl text-sm hover:brightness-110 transition-all active:scale-95"
                    >
                        Unlock Premium
                    </button>
                </motion.div>
            </div>

            <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}
