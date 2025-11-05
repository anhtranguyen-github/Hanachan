import { cn } from '@/lib/utils';
import { Card } from './Card';

/**
 * ForecastMessageCard (Type H)
 * 
 * Features: Illustration + dynamic contextual message
 * Used for: ForecastCard, StudyTipsCard
 */

export interface ForecastMessageCardProps {
    illustration?: React.ReactNode;
    illustrationBg?: string;
    message: React.ReactNode;
    highlights?: Array<{
        text: string | number;
        color?: string;
    }>;
    action?: {
        label: string;
        onClick?: () => void;
    };
    className?: string;
    loading?: boolean;
}

export function ForecastMessageCard({
    illustration,
    illustrationBg = 'bg-white border-black',
    message,
    highlights,
    action,
    className,
    loading = false,
}: ForecastMessageCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-start gap-4">
                    <div className={cn('w-20 h-20 border-black', illustrationBg)} />
                    <div className="flex-1 space-y-2 pt-2">
                        <div className="h-4 w-full bg-black/10" />
                        <div className="h-4 w-3/4 bg-black/10" />
                        <div className="h-4 w-1/2 bg-black/10" />
                    </div>
                </div>
            </Card>
        );
    }

    // Parse message to highlight numbers
    const renderMessage = () => {
        if (!highlights || highlights.length === 0) {
            return <span>{message}</span>;
        }

        // Simple message, highlights are rendered inline
        return (
            <span>
                {message}
                {highlights.map((h, i) => (
                    <span
                        key={i}
                        className="font-black text-black underline mx-1 decoration-1 underline-offset-2"
                    >
                        {h.text}
                    </span>
                ))}
            </span>
        );
    };

    return (
        <Card className={cn("border-black", className)}>
            <div className="flex items-start gap-6">
                {/* Illustration */}
                {illustration && (
                    <div className={cn(
                        'w-20 h-20 border border-black flex items-center justify-center flex-shrink-0 relative overflow-hidden',
                        illustrationBg
                    )}>
                        {illustration}
                    </div>
                )}

                {/* Message */}
                <div className="flex-1 text-xs font-black text-black leading-relaxed uppercase tracking-wider pt-1">
                    {typeof message === 'string' ? (
                        <p>{renderMessage()}</p>
                    ) : (
                        message
                    )}

                    {/* Action Button */}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-6 px-4 py-3 border border-black text-[10px] font-black text-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
}

export default ForecastMessageCard;
