import React, { ReactNode } from 'react';

interface ScreenLayoutProps {
    children: ReactNode;
    background?: 'pink' | 'green' | 'none';
    theme?: 'dark' | 'light';
}

export function ScreenLayout({ children, background = 'pink', theme = 'dark' }: ScreenLayoutProps) {
    const bgColor = theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-brand-cream';

    return (
        <div className={`h-[100dvh] w-full relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden ${bgColor}`}>
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {background === 'pink' && (
                    <>
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F4ACB74D] blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#CDB4DB33] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#A2D2FF22] blur-[100px] rounded-full"></div>
                    </>
                )}
                {background === 'green' && (
                    <>
                        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A2D2FF33] blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B7E4C722] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </>
                )}
            </div>

            {/* Inner scroll container for extreme small heights (controlled scrolling) */}
            <div className="relative z-10 w-full max-w-[440px] max-h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center py-2 no-scrollbar">
                <div className="w-full relative">
                    {children}
                </div>
            </div>

            {/* Hide scrollbar styles */}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </div>
    );
}
