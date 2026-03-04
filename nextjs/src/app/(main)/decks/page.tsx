'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DecksRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/content');
    }, [router]);

    return (
        <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-xs font-black uppercase tracking-widest text-foreground/20">
                Redirecting to Decks...
            </div>
        </div>
    );
}
