import React, { ReactNode, useEffect } from 'react';

interface ScreenLayoutProps {
    children: ReactNode;
    background?: 'pink' | 'green' | 'none';
    theme?: 'dark' | 'light';
}

export function ScreenLayout({ children, background = 'pink', theme = 'dark' }: ScreenLayoutProps) {
    const bgColor = theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-brand-cream';

    useEffect(() => {
        // Hard-lock the viewport for screen-based layouts
        document.documentElement.classList.add('screen-locked');
        document.body.classList.add('screen-locked');

        // Cleanup: restore normal scrolling when leaving the screen
        return () => {
            document.documentElement.classList.remove('screen-locked');
            document.body.classList.remove('screen-locked');
        };
    }, []);

    return (
        <div className={`h-[100dvh] w-full relative flex flex-col items-center justify-center p-3 sm:p-6 ${bgColor} overflow-hidden font-sans overscroll-none`}>
            {/* Dynamic Background - clipped to container */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
                {background === 'pink' && (
                    <>
                        <div className="absolute top-[0%] left-[0%] w-[40%] h-[40%] bg-[#F4ACB74D] blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] bg-[#CDB4DB33] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#A2D2FF22] blur-[100px] rounded-full"></div>
                    </>
                )}
                {background === 'green' && (
                    <>
                        <div className="absolute bottom-[0%] left-[0%] w-[40%] h-[40%] bg-[#A2D2FF33] blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute top-[0%] right-[0%] w-[50%] h-[50%] bg-[#B7E4C722] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </>
                )}
            </div>

            {/* Main content area - fixed to viewport, no scrolling */}
            <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center overflow-hidden">
                {children}
            </div>
        </div>
    );
}

