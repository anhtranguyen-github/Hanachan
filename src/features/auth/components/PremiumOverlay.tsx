import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
// import { UpgradeModal } from './UpgradeModal'; // Assuming missing, we can stub or remove if not needed.
// For now, I'll assume UpgradeModal exists or stub it if missing.

// Stub UpgradeModal for safety
const UpgradeModal = ({ isOpen, onClose }: any) => isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-lg">
            <h2>Mock Upgrade Modal</h2>
            <button onClick={onClose}>Close</button>
        </div>
    </div>
) : null;

interface PremiumOverlayProps {
    children: React.ReactNode;
    isLocked?: boolean;
    title?: string;
    description?: string;
}

export function PremiumOverlay({
    children,
    isLocked,
    title = "Premium Feature",
    description = "Upgrade to unlock detailed analytics and advanced tools."
}: PremiumOverlayProps) {
    const { profile } = useAuth(); // profile might be undefined in mock auth
    const [showModal, setShowModal] = useState(false);

    // Determines lock
    const hasAccess = profile?.role === 'USER' || profile?.role === 'ADMIN';
    // If we're mocking, let's just default to UNLOCKED unless forced, or locked if we strictly want to test premium UI
    // Given UI-only request, let's assume default is unlocked to show content, or locked to show UI.
    // Let's mimic real logic:
    const locked = isLocked !== undefined ? isLocked : !hasAccess;

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
                <div className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-2xl max-w-sm border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                        <Lock size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        {description}
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-2.5 bg-rose-500 text-white font-bold rounded-xl text-sm hover:bg-rose-600 transition-all active:scale-95"
                    >
                        Unlock Premium
                    </button>
                </div>
            </div>

            <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}
