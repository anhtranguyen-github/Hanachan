'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#F4ACB7] rounded-2xl blur-xl opacity-30 animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-3xl">
                            花
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If user is logged in, they're redirected to dashboard above
    // This is the landing page for non-authenticated users

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0c]">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F4ACB74D] blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#CDB4DB33] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#A2D2FF22] blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[10%] w-[25%] h-[25%] bg-[#BDE0FE15] blur-[80px] rounded-full"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] rounded-xl blur-sm opacity-50"></div>
                        <div className="relative w-10 h-10 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-xl">
                            花
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">
                        HanaChan <span className="text-[#F4ACB7]">V2</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="px-5 py-2.5 text-white hover:text-[#F4ACB7] font-medium transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className="px-5 py-2.5 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] hover:from-[#F4ACB7]/90 hover:to-[#CDB4DB]/90 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 px-6 lg:px-12 pt-12 lg:pt-20 pb-20">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Content */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                            <span className="w-2 h-2 bg-[#F4ACB7] rounded-full animate-pulse"></span>
                            <span className="text-sm text-gray-300">Advanced Japanese Learning Platform</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                            Master Japanese{' '}
                            <span className="bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] bg-clip-text text-transparent">
                                Your Way
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Experience a revolutionary learning system that combines spaced repetition,
                            immersive AI chat, and personalized video dictation to accelerate your journey to fluency.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/signup"
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] hover:from-[#F4ACB7]/90 hover:to-[#CDB4DB]/90 text-white font-bold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#F4ACB7]/20"
                            >
                                Start Learning Free
                            </Link>
                            <Link
                                href="/dashboard"
                                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all"
                            >
                                Browse as Guest
                            </Link>
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-8 py-4 text-gray-400 hover:text-white font-bold transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
                        {/* Feature 1: AI Chat */}
                        <div className="group p-8 bg-[#16161a]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#F4ACB7]/30 transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">AI Conversation Partner</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Practice Japanese with Hana, an AI tutor that adapts to your level and helps you learn through natural conversation.
                            </p>
                        </div>

                        {/* Feature 2: SRS Learning */}
                        <div className="group p-8 bg-[#16161a]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#CDB4DB]/30 transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#CDB4DB] to-[#A2D2FF] rounded-2xl flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Smart SRS System</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Spaced repetition technology ensures you review words at the optimal time for long-term retention.
                            </p>
                        </div>

                        {/* Feature 3: Video Dictation */}
                        <div className="group p-8 bg-[#16161a]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#A2D2FF]/30 transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#A2D2FF] to-[#BDE0FE] rounded-2xl flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Video Dictation</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Learn from authentic Japanese content with interactive dictation exercises powered by AI.
                            </p>
                        </div>

                        {/* Feature 4: Speaking Practice */}
                        <div className="group p-8 bg-[#16161a]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#F4ACB7]/30 transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#F4ACB7] to-[#FFAFCC] rounded-2xl flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Speaking Practice</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Improve pronunciation with AI-powered speech recognition and get instant feedback on your speaking.
                            </p>
                        </div>

                        {/* Feature 5: Reading Practice */}
                        <div className="group p-8 bg-[#16161a]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#CDB4DB]/30 transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#CDB4DB] to-[#F4ACB7] rounded-2xl flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Reading Comprehension</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Practice reading with native-level content at your proficiency level with intelligent word lookups.
                            </p>
                        </div>

                        {/* Feature 6: Progress Tracking */}
                        <div className="group p-8 bg-[#16161a]/80 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-[#A2D2FF]/30 transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#A2D2FF] to-[#CDB4DB] rounded-2xl flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Progress Analytics</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Track your learning journey with detailed analytics and insights into your strengths and areas to improve.
                            </p>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-24 text-center">
                        <div className="inline-block p-1 bg-gradient-to-r from-[#F4ACB7] via-[#CDB4DB] to-[#A2D2FF] rounded-3xl">
                            <div className="bg-[#0a0a0c] rounded-[22px] px-12 py-10">
                                <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
                                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                    Join thousands of learners mastering Japanese with our innovative platform.
                                </p>
                                <Link
                                    href="/signup"
                                    className="inline-block px-10 py-4 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] hover:from-[#F4ACB7]/90 hover:to-[#CDB4DB]/90 text-white font-bold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#F4ACB7]/20"
                                >
                                    Create Free Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-8">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <span className="font-bold text-white">HanaChan V2</span>
                        <span>•</span>
                        <span>Advanced Japanese Learning</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="/login" className="hover:text-[#F4ACB7] transition-colors">Sign In</Link>
                        <Link href="/signup" className="hover:text-[#F4ACB7] transition-colors">Sign Up</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
