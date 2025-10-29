import React from 'react';
import { Book, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists, if not use standard class concatenation

interface PendingDeckCardProps {
    name: string;
    description?: string;
    items: Array<{ content_id: string; content_type: string }>;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const PendingDeckCard: React.FC<PendingDeckCardProps> = ({
    name,
    description,
    items,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    return (
        <div className="w-full max-w-md bg-white rounded-2xl border border-sakura-divider  overflow-hidden my-4">
            <div className="bg-sakura-bg-soft px-4 py-3 border-b border-sakura-divider flex items-center gap-2">
                <Book className="text-sakura-accent-primary" size={18} />
                <span className="font-black text-xs uppercase tracking-widest text-sakura-text-muted">
                    Deck Proposal
                </span>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <h3 className="text-lg font-black text-sakura-text-primary mb-1">{name}</h3>
                    {description && (
                        <p className="text-sm text-sakura-text-secondary">{description}</p>
                    )}
                </div>

                <div className="bg-sakura-bg-app rounded-xl p-3 text-sm border border-sakura-divider">
                    <span className="font-bold text-sakura-text-primary">{items.length} items</span>
                    <span className="text-sakura-text-muted"> selected from your request</span>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={16} />
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-sakura-accent-primary hover:bg-sakura-accent-secondary text-white rounded-xl font-bold text-sm transition-colors  flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                        Confirm & Create
                    </button>
                </div>
            </div>
        </div>
    );
};
