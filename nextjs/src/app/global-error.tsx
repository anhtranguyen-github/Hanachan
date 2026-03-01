"use client";

import { useEffect } from "react";
import { ScreenLayout } from "@/components/layout/ScreenLayout";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <ScreenLayout background="none" theme="light">
                    <div className="max-w-md rounded-xl border-2 border-brand-dark bg-white p-8 ">
                        <h2 className="mb-4 text-2xl font-black text-brand-dark">Critical Error</h2>
                        <p className="mb-6 font-medium text-brand-dark/70">
                            Something went wrong, and we couldn&apos;t load the application.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="rounded-lg border-2 border-brand-dark bg-brand-blue px-6 py-2.5 font-bold text-brand-dark  transition-all hover:translate-y-[1px] hover: active:translate-y-[2px] active:"
                        >
                            Reload Application
                        </button>
                    </div>
                </ScreenLayout>
            </body>
        </html>
    );
}
