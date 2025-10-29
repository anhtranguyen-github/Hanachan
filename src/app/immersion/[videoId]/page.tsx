'use client';

import { useRouter } from 'next/navigation';
import { SakuraHeader } from '@/components/SakuraHeader';
import { BRAND_COLORS } from '@/config/design.config';
import { YouTubeComponent } from '@/modules/youtube/components/YouTubeComponent';

interface ImmersionVideoPageProps {
    params: {
        videoId: string;
    };
}

export default function ImmersionVideoPage({ params }: ImmersionVideoPageProps) {
    const router = useRouter();
    const { videoId } = params;

    return (
        <div className="min-h-screen bg-transparent pb-10 flex flex-col">
            <SakuraHeader
                title="Deep Immersion"
                subtitle={`SYNTHESIS: ${videoId}`}
                subtitleColor="#EF4444"
                actions={
                    <button
                        onClick={() => router.push('/immersion')}
                        className="px-4 py-2 rounded-xl bg-white border border-sakura-divider text-[10px] font-black text-sakura-cocoa/60 hover:text-sakura-ink transition-all uppercase tracking-widest shadow-sm"
                    >
                        Library
                    </button>
                }
            />

            <main className="max-w-[1600px] mx-auto px-6 py-8 w-full flex-1 flex flex-col">
                <div className="bg-white rounded-[2.5rem] border border-sakura-divider overflow-hidden flex-1 shadow-sm">
                    <YouTubeComponent
                        videoId={videoId}
                        onBackToLibrary={() => router.push('/immersion')}
                    />
                </div>
            </main>
        </div>
    );
}
