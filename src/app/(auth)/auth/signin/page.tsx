"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";

export default function SignInPage() {
    const router = useRouter();
    const { signIn, signInWithGoogle, isAuthResolved } = useAuth();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const nextPath = searchParams?.get('next') || "/decks";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    // Redirect if already logged in (Auto-redirect)
    // NOTE: We now rely primarily on Server-side Middleware for this.
    // This client-side check is a fallback but can be removed if middleware is robust.
    /*
    useEffect(() => {
        if (isAuthResolved && user) {
            console.log('[SignInPage] User already detected, redirecting to:', nextPath);
            router.replace(nextPath);
        }
    }, [user, isAuthResolved, router, nextPath]);
    */

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const { error: signInError } = await signIn(email, password);

            if (signInError) {
                setError(signInError.message);
                setSubmitting(false);
            } else {
                // Success - redirect to dashboard
                // Force a full page reload to ensure cookies and session are perfectly synced
                window.location.href = nextPath;
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-sakura-bg-soft p-4">
            <div className="w-full max-w-md bg-white border border-sakura-divider rounded-3xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-sakura-text-primary">Welcome to Hanachan</h1>
                    <p className="text-sm text-sakura-text-muted mt-2">Sign in to continue learning</p>
                </div>

                {/* OAuth Providers */}
                <div className="space-y-3">
                    <button
                        onClick={() => signInWithGoogle()}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-sakura-divider rounded-xl hover:bg-sakura-bg-soft transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-sakura-divider"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-sakura-text-muted">Or continue with email</span>
                    </div>
                </div>

                {/* Credentials Form */}
                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-sakura-text-muted uppercase tracking-widest mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-sakura-divider rounded-xl focus:outline-none focus:ring-2 focus:ring-sakura-accent-primary"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-sakura-text-muted uppercase tracking-widest mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-sakura-divider rounded-xl focus:outline-none focus:ring-2 focus:ring-sakura-accent-primary"
                            placeholder="••••"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !isAuthResolved}
                        className="w-full px-4 py-3 bg-sakura-accent-primary text-white font-black uppercase tracking-widest text-sm rounded-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
