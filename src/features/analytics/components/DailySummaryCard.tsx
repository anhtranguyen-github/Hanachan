import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
const useGlobalAuth = () => ({ openAuth: (mode: string, options: any) => { } });

interface DailySummaryCardProps {
    userName: string;
    level: number;
    reviewsCount: number;
    lessonsCount: number;
    streak?: number;
    isGuest?: boolean;
    className?: string;
}

export function DailySummaryCard({
    userName,
    level,
    reviewsCount,
    lessonsCount,
    streak,
    isGuest,
    className
}: DailySummaryCardProps) {
    const { openAuth } = useGlobalAuth();
    const [greeting, setGreeting] = React.useState('Ohayou'); // Default to a safe string

    React.useEffect(() => {
        const hours = new Date().getHours();
        setGreeting(hours < 12 ? 'Ohayou' : hours < 18 ? 'Konnichiwa' : 'Konbanwa');
    }, []);

    return (
        <div className={cn(
            "bg-white border border-sakura-divider rounded-[2rem] p-8 relative overflow-hidden flex flex-col",
            className
        )}>
            {/* Background Accent / Illustration */}
            <div className="absolute top-0 right-0 w-64 h-full pointer-events-none select-none">
                <div className="relative w-full h-full">
                    <Image
                        src="/scholar.png"
                        alt="Scholar"
                        fill
                        priority
                        className="object-contain object-right transform translate-x-8 mix-blend-multiply"
                    />
                </div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <h1 className={cn(
                        "font-black text-sakura-text-primary tracking-tight transition-all",
                        isGuest ? "text-3xl" : "text-4xl"
                    )}>
                        {isGuest ? (
                            <>Welcome to <span className="text-sakura-accent-primary">hanachan!</span></>
                        ) : (
                            <>{greeting}, <span className="text-sakura-accent-green">{userName}!</span></>
                        )}
                    </h1>
                    <p className={cn(
                        "font-bold text-sakura-text-secondary italic transition-all",
                        isGuest ? "text-base max-w-sm" : "text-xl"
                    )}>
                        {isGuest ? (
                            <>Start your Japanese journey for free. <span
                                onClick={() => openAuth("REGISTER", { flowType: 'LIBRARY', title: "Join hanachan" })}
                                className="text-sakura-accent-primary not-italic font-black cursor-pointer hover:underline"
                            >Sign in</span> to track your progress!</>
                        ) : (
                            <>Let&apos;s make some progress today!</>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap lg:mr-32">
                    {/* Pending Reviews */}
                    <div className="bg-sakura-bg-soft/50 border border-sakura-divider px-5 py-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-white ">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-sakura-divider ">
                            <Star className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-sakura-text-muted">Reviews</div>
                            <div className="text-lg font-black text-sakura-text-primary leading-none">{reviewsCount}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
