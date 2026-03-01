
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-3xl animate-pulse">
                    花
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0c] text-white font-sans selection:bg-[#F4ACB7]/30">
            {/* Dynamic Background Gradients */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F4ACB710] blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#CDB4DB08] blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[30%] right-[0%] w-[40%] h-[40%] bg-[#A2D2FF05] blur-[120px] rounded-full"></div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0a0a0c]/50 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-4">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-10 h-10 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                                花
                            </div>
                        </div>
                        <span className="text-2xl font-black tracking-tight">
                            HanaChan <span className="text-[#F4ACB7]">V2</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#curriculum" className="hover:text-white transition-colors">Curriculum</a>
                        <a href="#ai-tutor" className="hover:text-white transition-colors">AI Tutor</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-5 py-2 text-white hover:text-[#F4ACB7] font-medium transition-colors hidden sm:block"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/signup"
                            className="px-6 py-2.5 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] text-white font-bold rounded-full transition-all transform hover:scale-[1.05] active:scale-[0.95]"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 lg:pt-48 pb-20 px-6 lg:px-12 text-center overflow-hidden">
                <div className="max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-xl">
                        <span className="w-2 h-2 bg-[#F4ACB7] rounded-full animate-ping"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#F4ACB7]">Revolutionizing Japanese Learning</span>
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
                        Master Japanese,<br />
                        <span className="bg-gradient-to-r from-[#F4ACB7] via-[#CDB4DB] to-[#A2D2FF] bg-clip-text text-transparent">
                            Powered by AI.
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Say goodbye to static textbooks. Experience a living Japanese environment with
                        Spaced Repetition, Adaptive AI Tutors, and Interactive Video Immersion.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/signup"
                            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] text-white font-black text-lg rounded-2xl shadow-2xl shadow-[#F4ACB7]/30 transition-all hover:scale-[1.05]"
                        >
                            Start Your Journey
                        </Link>
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-lg rounded-2xl transition-all"
                        >
                            Browse as Guest
                        </Link>
                    </div>
                </div>

                {/* Hero Feature Visual: REAL Dashboard Preview */}
                <div className="mt-24 relative max-w-6xl mx-auto group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4ACB7]/5 to-[#0a0a0c] z-10 pointer-events-none"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#F4ACB7]/20 to-[#A2D2FF]/20 rounded-[2.5rem] blur-2xl opacity-30"></div>
                    <div className="relative bg-[#16161a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transform transition-transform duration-700 hover:scale-[1.01]">
                        <Image
                            src="/screenshots/dashboard_real.png"
                            alt="HanaChan Real Dashboard"
                            width={1200}
                            height={800}
                            className="w-full h-auto opacity-95"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-32 px-6 lg:px-12 bg-[#0d0d12]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl lg:text-5xl font-black mb-6">Real Progress, Real Data</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] mx-auto rounded-full"></div>
                    </div>

                    {/* Feature 1: Curriculum */}
                    <div id="curriculum" className="grid lg:grid-cols-2 gap-24 items-center mb-40">
                        <div>
                            <div className="w-16 h-16 bg-[#F4ACB7]/20 rounded-2xl flex items-center justify-center mb-8">
                                <svg className="w-8 h-8 text-[#F4ACB7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black mb-6 leading-tight">Systematic Mastery</h3>
                            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                Our comprehensive curriculum covers everything from basic Radicals to Advanced Kanji and N1 Grammar.
                                Track your progress precisely as you unlock new levels of fluency.
                            </p>
                            <ul className="space-y-4">
                                {['9000+ Vocabulary Items', 'Visual Progress Tracking', 'JLPT Aligned Content'].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-gray-300">
                                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative group">
                            <div className="relative bg-[#16161a] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
                                <Image
                                    src="/screenshots/learning_path_real.png"
                                    alt="Real Learning Path"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: AI Chat */}
                    <div id="ai-tutor" className="grid lg:grid-cols-2 gap-24 items-center mb-40">
                        <div className="order-2 lg:order-1 relative group">
                            <div className="relative bg-[#16161a] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
                                <Image
                                    src="/screenshots/ai_chat_real.png"
                                    alt="Real AI Tutor Chat"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="w-16 h-16 bg-[#A2D2FF]/20 rounded-2xl flex items-center justify-center mb-8">
                                <svg className="w-8 h-8 text-[#A2D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black mb-6 leading-tight">Personalized AI Tutor</h3>
                            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                Chat with Hanachan, your tireless Japanese sensei. She understands your level,
                                corrected your mistakes, and helps you build the confidence to speak.
                            </p>
                            <ul className="space-y-4">
                                {['Natural Conversation Flows', 'Instant Grammar Help', 'Voice Support Integration'].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-gray-300">
                                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Feature 3: Video Library */}
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <div className="w-16 h-16 bg-[#CDB4DB]/20 rounded-2xl flex items-center justify-center mb-8">
                                <svg className="w-8 h-8 text-[#CDB4DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black mb-6 leading-tight">Immersive Video Tools</h3>
                            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                                Build your own study library from YouTube. Our tools analyze video transcripts,
                                identify JLPT levels, and help you learn from real-world content.
                            </p>
                            <ul className="space-y-4">
                                {['Interactive Subtitles', 'JLPT Vocabulary Analysis', 'Custom Library Management'].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-gray-300">
                                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative group">
                            <div className="relative bg-[#16161a] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
                                <Image
                                    src="/screenshots/video_library_real.png"
                                    alt="Real Video Library"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="relative z-10 py-20 px-6 lg:px-12 border-y border-white/5 bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                        { label: "SRS Reviews Done", value: "1.2M+" },
                        { label: "AI Messages", value: "450K+" },
                        { label: "Active Users", value: "2,500+" },
                        { label: "Daily Streaks", value: "1,100+" }
                    ].map((stat, i) => (
                        <div key={i}>
                            <div className="text-4xl lg:text-5xl font-black text-[#F4ACB7] mb-2">{stat.value}</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 py-40 px-6 lg:px-12 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight">Ready to speak?<br />Start for free today.</h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join a community of dedicated learners using the next generation
                        of Japanese learning technology. No credit card required.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-block px-12 py-5 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] text-white font-black text-xl rounded-2xl shadow-2xl transition-all hover:scale-[1.05]"
                    >
                        Create My Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12 bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-lg flex items-center justify-center text-white font-black">花</div>
                        <span className="font-bold tracking-tight">HanaChan V2</span>
                    </div>
                    <div className="flex gap-10 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                        © 2024 Hanachan. Build your Japanese dreams.
                    </div>
                </div>
            </footer>
        </div>
    );
}
