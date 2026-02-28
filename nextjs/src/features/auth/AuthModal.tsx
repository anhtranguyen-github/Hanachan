/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { clsx } from 'clsx';

export function AuthModal() {
    const router = useRouter();
    const { authModal, closeAuthModal } = useAuth();
    const { isOpen, mode } = authModal;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setFullName('');
            setError(null);
            setSuccessMessage(null);
        }
    }, [isOpen, mode]);

    if (!mounted || !isOpen) return null;

    const isLogin = mode === 'login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    setError(signInError.message);
                } else {
                    closeAuthModal();
                    router.refresh();
                }
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: fullName,
                        },
                    },
                });

                if (signUpError) {
                    setError(signUpError.message);
                } else if (data.user) {
                    setSuccessMessage('Enrollment successful! Please check your email to verify your account.');
                    setTimeout(() => {
                        closeAuthModal();
                    }, 2000);
                }
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'github' | 'google' | 'facebook') => {
        setLoading(true);
        setError(null);
        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (oauthError) throw oauthError;
        } catch (err: any) {
            setError(err.message || `An error occurred while connecting to ${provider}`);
            setLoading(false);
        }
    };

    const switchMode = () => {
        if (isLogin) {
            // This would require updating context, but for now we'll just close and let parent handle
            closeAuthModal();
        } else {
            closeAuthModal();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={closeAuthModal}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md animate-scale-in">
                {/* Background Effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] rounded-3xl blur opacity-30"></div>
                
                <div className="relative bg-[#16161a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Close Button */}
                    <button
                        onClick={closeAuthModal}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="p-8 pb-6 text-center">
                        <div className="relative inline-block">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] rounded-xl blur opacity-25"></div>
                            <div className="relative text-4xl font-black bg-[#0a0a0c] border border-[#F4ACB733] p-3 rounded-xl text-white">
                                花
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mt-4">
                            {isLogin ? 'Welcome Back' : 'Join HanaChan'}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {isLogin 
                                ? 'Sign in to continue your Japanese learning journey' 
                                : 'Start your Japanese learning adventure today'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 pb-8">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                                {successMessage}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#F4ACB7] focus:ring-1 focus:ring-[#F4ACB7] transition-all"
                                    placeholder="Enter your name"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#F4ACB7] focus:ring-1 focus:ring-[#F4ACB7] transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#F4ACB7] focus:ring-1 focus:ring-[#F4ACB7] transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] hover:from-[#F4ACB7]/90 hover:to-[#CDB4DB]/90 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </span>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-[#16161a] text-gray-500 uppercase tracking-wider">Or continue with</span>
                            </div>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('github')}
                                disabled={loading}
                                className="flex items-center justify-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                className="flex items-center justify-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('facebook')}
                                disabled={loading}
                                className="flex items-center justify-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </button>
                        </div>

                        {/* Switch Mode */}
                        <div className="mt-6 text-center">
                            {isLogin ? (
                                <p className="text-gray-400 text-sm">
                                    Don't have an account?{' '}
                                    <Link 
                                        href="/signup" 
                                        className="text-[#F4ACB7] hover:text-[#F4ACB7]/80 font-medium transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            closeAuthModal();
                                            // Could trigger register modal here
                                        }}
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            ) : (
                                <p className="text-gray-400 text-sm">
                                    Already have an account?{' '}
                                    <Link 
                                        href="/login" 
                                        className="text-[#F4ACB7] hover:text-[#F4ACB7]/80 font-medium transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            closeAuthModal();
                                        }}
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
