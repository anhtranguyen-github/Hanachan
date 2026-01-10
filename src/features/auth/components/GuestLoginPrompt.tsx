"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function GuestLoginPrompt() {
    const { user } = useAuth();
    const router = useRouter();

    if (user) return null;

    return (
        <div className="bg-sakura-bg-soft border border-sakura-divider rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 my-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg ">
                    <LogIn className="text-sakura-accent-primary" size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-sm text-foreground">Have an account?</h4>
                    <p className="text-xs text-muted-foreground">Sign in to save your progress and sync across devices.</p>
                </div>
            </div>
            <button
                onClick={() => router.push('/auth/signin')}
                className="whitespace-nowrap px-4 py-2 bg-white border border-sakura-divider hover:bg-sakura-bg hover:border-sakura-accent-primary text-sakura-text-primary text-sm font-bold rounded-lg transition-all"
            >
                Sign In / Sign Up
            </button>
        </div>
    );
}
