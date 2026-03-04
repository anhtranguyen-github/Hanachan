

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/features/auth/AuthContext';
import {
    Zap,
    MessageSquare,
    Video,
    Library,
    BarChart3,
    ChevronRight,
    Play,
    Trophy,
    Globe,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!loading && user) {
            router.replace('/chat');
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
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#F4ACB715] blur-[160px] rounded-full animate-pulse opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#CDB4DB0a] blur-[200px] rounded-full animate-pulse opacity-40" style={{ animationDelay: '3s' }}></div>
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-[#A2D2FF08] blur-[140px] rounded-full"></div>
            </div>

            {/* Glassmorphism Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#0a0a0c]/80 backdrop-blur-xl py-4 border-white/10' : 'bg-transparent py-6 border-transparent'
                }`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] rounded-xl blur-md opacity-40 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-10 h-10 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20">
                                花
                            </div>
                        </div>
                        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            HanaChan <span className="text-[#F4ACB7]">V2</span>
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10 text-sm font-semibold text-gray-400">
                        <a href="#features" className="hover:text-white transition-all hover:scale-105">Platform</a>
                        <a href="#ai-tutor" className="hover:text-white transition-all hover:scale-105">AI Sensei</a>
                        <a href="#immersion" className="hover:text-white transition-all hover:scale-105">Immersion</a>
                        <a href="#decks" className="hover:text-white transition-all hover:scale-105">Custom Decks</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2 text-gray-300 hover:text-white font-bold transition-all hidden sm:block"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="group relative px-8 py-3 bg-white text-[#0a0a0c] font-black rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Start Learning Free <ChevronRight className="w-4 h-4" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-40 lg:pt-56 pb-24 px-6 lg:px-12 text-center">
                <div className="max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-2xl">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F4ACB7] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F4ACB7]"></span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4ACB7]">The Future of Language Acquisition</span>
                    </div>

                    <h1 className="text-6xl lg:text-[100px] font-[1000] mb-10 leading-[0.95] tracking-tight">
                        Master Japanese.<br />
                        <span className="bg-gradient-to-r from-[#F4ACB7] via-[#CDB4DB] to-[#A2D2FF] bg-clip-text text-transparent">
                            Live your language.
                        </span>
                    </h1>

                    <p className="text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                        Ditch the flashcards. Experience a living Japanese environment with
                        <span className="text-white"> Spaced Repetition</span>,
                        <span className="text-white"> AI Senseis</span>, and
                        <span className="text-white"> Real-world Video Immersion</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/signup"
                            className="w-full sm:w-auto px-12 py-6 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] text-white font-black text-xl rounded-2xl shadow-[0_20px_50px_rgba(244,172,183,0.3)] transition-all hover:scale-[1.05] hover:shadow-[0_25px_60px_rgba(244,172,183,0.4)]"
                        >
                            Claim Your Free Account
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto px-12 py-6 bg-white/5 border border-white/10 text-white font-black text-xl rounded-2xl backdrop-blur-xl transition-all hover:bg-white/10"
                        >
                            Explore Platform
                        </a>
                    </div>
                </div>

                {/* Hero Dashboard Preview */}
                <div className="mt-32 relative max-w-7xl mx-auto px-4 perspective-[2000px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent z-20 pointer-events-none"></div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#F4ACB7]/20 via-[#A2D2FF]/20 to-[#CDB4DB]/20 rounded-[3rem] blur-3xl opacity-30 animate-pulse"></div>

                    <div className="relative group bg-[#16161a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] transform-gpu rotate-X-[5deg] transition-all duration-1000 hover:rotate-X-0">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none transition-opacity group-hover:opacity-0"></div>
                        <Image
                            src="/screenshots/dashboard_real.png"
                            alt="HanaChan Real Dashboard"
                            width={1920}
                            height={1080}
                            className="w-full h-auto opacity-100 scale-[1.02] group-hover:scale-100 transition-transform duration-1000"
                            priority
                        />
                        {/* Interactive UI Element Mock */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 flex items-center justify-center z-30 group-hover:scale-110 transition-transform shadow-2xl">
                            <Play className="w-10 h-10 text-white fill-white" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Stats */}
            <section className="relative z-10 py-24 px-6 lg:px-12 border-y border-white/5 bg-[#0a0a0c]/50 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 text-center">
                    {[
                        { label: "SRS Reviews Active", value: "1.4M+", icon: Zap },
                        { label: "AI Conversations", value: "620K+", icon: MessageSquare },
                        { label: "Learning Hours", value: "85K+", icon: BarChart3 },
                        { label: "Native Content", value: "12K+", icon: Library }
                    ].map((stat, i) => (
                        <div key={i} className="group flex flex-col items-center">
                            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-[#F4ACB7]/30 transition-colors">
                                <stat.icon className="w-6 h-6 text-[#F4ACB7]" />
                            </div>
                            <div className="text-5xl font-black tracking-tighter text-white mb-2">{stat.value}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Core Pillars */}
            <section id="features" className="relative z-10 py-32 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="inline-block px-4 py-1.5 bg-[#F4ACB7]/10 border border-[#F4ACB7]/20 rounded-full mb-6">
                            <span className="text-[#F4ACB7] text-xs font-black uppercase tracking-widest">Platform DNA</span>
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black mb-8">Designed for Polylots</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Most apps teach you <span className="text-white italic">about</span> Japanese. <br />
                            We give you the tools to actually <span className="text-white italic">use</span> it.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Cognitive Science",
                                desc: "Advanced FSRS scheduling that adapts to your unique brain patterns for permanent retention.",
                                icon: Sparkles,
                                color: "#F4ACB7"
                            },
                            {
                                title: "Cultural Immersion",
                                desc: "Real native content library built from the ground up to connect you with actual Japanese media.",
                                icon: Globe,
                                color: "#A2D2FF"
                            },
                            {
                                title: "AI Fluency Coaching",
                                desc: "A personalized AI Sensei that corrects your grammar and encourages natural speech patterns.",
                                icon: BarChart3,
                                color: "#CDB4DB"
                            }
                        ].map((item, i) => (
                            <div key={i} className="group relative p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 shadow-lg`} style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}30` }}>
                                    <item.icon className="w-7 h-7" style={{ color: item.color }} />
                                </div>
                                <h4 className="text-2xl font-black mb-4">{item.title}</h4>
                                <p className="text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Split Feature: Learning Path */}
            <section className="relative z-10 py-32 px-6 lg:px-12 bg-[#0d0d12]">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                    <div className="relative group perspective-[1000px]">
                        <div className="absolute -inset-10 bg-[#F4ACB7]/10 blur-3xl opacity-30 rounded-full group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative bg-[#16161a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl transform group-hover:rotate-Y-[-5deg] transition-transform duration-1000">
                            <Image
                                src="/screenshots/learning_path_real.png"
                                alt="Systematic Curriculum"
                                width={1000}
                                height={800}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-black mb-8 whitespace-pre-line tracking-tight">The Roadmap to{"\n"}True Fluency</h2>
                        <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                            From your first Radical to N1-level nuance. Our structured path ensures every minute spent studying translates into meaningful progress.
                        </p>
                        <div className="space-y-6">
                            {[
                                "9,000+ Native Audio Sentences",
                                "JLPT Aligned Kanji Mastery",
                                "Visual Knowledge Graph Progress",
                                "Context-Rich Vocabulary Learning"
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-4 text-gray-200 font-bold">
                                    <CheckCircle2 className="w-6 h-6 text-[#F4ACB7]" />
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Sensei: Memory & Context */}
            <section id="ai-tutor" className="relative z-10 py-32 px-6 lg:px-12 bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                    <div>
                        <div className="inline-block px-4 py-1.5 bg-[#CDB4DB]/10 border border-[#CDB4DB]/20 rounded-full mb-6">
                            <span className="text-[#CDB4DB] text-xs font-black uppercase tracking-widest">Cognitive Core</span>
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black mb-8">An AI that <span className="text-[#CDB4DB]">actually</span> remembers.</h2>
                        <p className="text-xl text-gray-400 mb-12 leading-relaxed font-medium">
                            Most AI tutors forget you the moment the window closes. HanaChan builds a **Dual-Layer Memory Graph** (Episodic & Semantic) to recall your goals, past mistakes, and personal interests.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Episodic Flow", desc: "Recalls past conversation turns for seamless, contextual depth.", icon: MessageSquare },
                                { title: "Semantic Knowledge", desc: "Connects concepts to build a persistent map of your mastery.", icon: Globe },
                                { title: "Implicit Learning", desc: "Automatically extracts mnemonics from your natural speech.", icon: Sparkles }
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex-shrink-0 w-12 h-12 bg-[#CDB4DB]/20 rounded-xl flex items-center justify-center">
                                        <feature.icon className="w-6 h-6 text-[#CDB4DB]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">{feature.title}</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-10 bg-[#CDB4DB]/10 blur-3xl opacity-30 rounded-full"></div>
                        <div className="relative bg-[#16161a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl">
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0c] to-transparent z-10"></div>
                            <Image
                                src="/screenshots/ai_chat_real.png"
                                alt="AI Sensei Conversation"
                                width={1000}
                                height={800}
                                className="w-full h-auto opacity-90 group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Overlayed Agent Evidence */}
                            <div className="absolute bottom-8 left-8 right-8 z-20 p-6 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Live Agent Logic</span>
                                </div>
                                <code className="text-[11px] text-[#CDB4DB] font-mono leading-tight">
                                    {'PLAN: ["retrieve_episodic", "check_deck_status"]'}<br />
                                    {'FOUND: "User interest in N3 Weather vocabulary"'}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Multi-Agent Orchestration Section */}
            <section className="relative z-10 py-32 px-6 lg:px-12 border-y border-white/5 bg-gradient-to-b from-[#0a0a0c] to-[#0d0d12]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl lg:text-7xl font-black mb-8 italic tracking-tighter">Sophisticated Agents. <br />Precision Mastery.</h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium">
                            HanaChan isn't just one bot. It's a **LangGraph Network** of specialized agents working in harmony to manage your learning lifecycle.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                agent: "Deck Manager",
                                role: "Content Curator",
                                goal: "Automatically creates and manages custom study decks via natural language.",
                                path: "deck_manager.py",
                                icon: Library,
                                color: "#F4ACB7"
                            },
                            {
                                agent: "Reading Creator",
                                role: "Scenario Designer",
                                goal: "Generates tailored reading passages based on your real-time weak points.",
                                path: "reading_creator.py",
                                icon: CheckCircle2,
                                color: "#A2D2FF"
                            },
                            {
                                agent: "FSRS Optimizer",
                                role: "Neuroscience Core",
                                goal: "Fine-tunes review intervals using cognitive science and mastery patterns.",
                                path: "fsrs_agent.py",
                                icon: Zap,
                                color: "#FFD6A5"
                            },
                            {
                                agent: "Memory Architect",
                                role: "Knowledge Graph",
                                goal: "Maintains your personal ontology of interests and linguistic milestones.",
                                path: "memory_agent.py",
                                icon: Trophy,
                                color: "#CDB4DB"
                            }
                        ].map((agent, i) => (
                            <div key={i} className="group p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-2">
                                <div className="mb-8 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}30` }}>
                                    <agent.icon className="w-7 h-7" style={{ color: agent.color }} />
                                </div>
                                <div className="mb-4">
                                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">{agent.role}</div>
                                    <h4 className="text-2xl font-black">{agent.agent}</h4>
                                </div>
                                <p className="text-sm text-gray-400 mb-8 leading-relaxed font-medium">{agent.goal}</p>
                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                                        <code className="text-[10px] text-gray-600 font-mono italic">{agent.path}</code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature: Video Immersion */}
            <section id="immersion" className="relative z-10 py-32 px-6 lg:px-12 bg-[#0d0d12]">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                    <div className="group">
                        <div className="relative bg-[#16161a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl">
                            <Image
                                src="/screenshots/video_library_real.png"
                                alt="Video Library Tools"
                                width={1000}
                                height={800}
                                className="w-full h-auto opacity-95 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-[#CDB4DB]/20 rounded-2xl flex items-center justify-center mb-10">
                            <Video className="w-8 h-8 text-[#CDB4DB]" />
                        </div>
                        <h2 className="text-5xl font-black mb-8 tracking-tight">Learn from Reality</h2>
                        <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
                            Import any YouTube video and transform it into a learning tool. Our AI identifies vocab you know,
                            flags new grammar, and builds interactive subtitle loops for listening practice.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Transcript-to-Card Generation",
                                "One-Click Dictionary Lookup",
                                "Native Sentence Extraction",
                                "Visual Immersion Scoring"
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 text-gray-300">
                                    <div className="w-1.5 h-1.5 bg-[#CDB4DB] rounded-full"></div>
                                    <span className="font-bold">{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* New Feature: Custom Decks */}
            <section id="decks" className="relative z-10 py-32 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-10">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h2 className="text-5xl font-black mb-8 tracking-tight">Curate Your Path</h2>
                        <p className="text-lg text-gray-400 mb-10 leading-relaxed font-medium">
                            Our the new <span className="text-white">Custom Decks</span> system. Group KUs, sentences, and videos into personal collections.
                            Synchronized with our global knowledge graph, your personalized decks stay updated as languages evolve.
                        </p>
                        <div className="flex items-center gap-4 p-6 bg-[#F4ACB710] border border-[#F4ACB7] rounded-2xl mb-8">
                            <Sparkles className="w-8 h-8 text-[#F4ACB7]" />
                            <div>
                                <div className="font-black text-white">Deck Manager Agent</div>
                                <div className="text-gray-400 text-sm">Create, sync, and validate decks via natural language.</div>
                            </div>
                        </div>
                        <Link href="/signup" className="px-10 py-4 border-2 border-[#F4ACB7] text-[#F4ACB7] font-black rounded-2xl hover:bg-[#F4ACB7] hover:text-white transition-all text-center block sm:inline-block">
                            Build Your First Deck
                        </Link>
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="relative bg-[#16161a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl">
                            <Image
                                src="/screenshots/decks_real.png"
                                alt="Custom Deck Interface"
                                width={1000}
                                height={800}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 py-48 px-6 lg:px-12 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4ACB708] to-transparent pointer-events-none"></div>
                <div className="max-w-4xl mx-auto relative">
                    <div className="mb-10 flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl">
                            花
                        </div>
                    </div>
                    <h2 className="text-6xl lg:text-8xl font-black mb-10 leading-[1.1]">Ready to break the<br />language barrier?</h2>
                    <p className="text-xl lg:text-2xl text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed">
                        Join 2,500+ students mastering Japanese the right way.
                        No credit card. No pressure. Just results.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/signup"
                            className="w-full sm:w-auto px-16 py-8 bg-white text-[#0a0a0c] font-[1000] text-2xl rounded-3xl shadow-3xl transition-all hover:scale-[1.05] hover:-rotate-1"
                        >
                            Start Now — It's Free
                        </Link>
                    </div>
                    <p className="mt-8 text-gray-600 font-bold tracking-widest uppercase text-xs">Unlock all features for 14 days. No strings attached.</p>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer className="relative z-10 border-t border-white/5 py-20 bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="grid md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-2">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-xl">花</div>
                                <span className="text-2xl font-black tracking-tight">HanaChan V2</span>
                            </div>
                            <p className="text-gray-500 font-medium max-w-xs leading-relaxed">
                                Redefining Japanese fluency through AI-driven immersion and cognitive science.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-black uppercase tracking-widest text-xs text-white mb-8">Community</h5>
                            <div className="space-y-4 text-gray-500 font-bold text-sm">
                                <a href="#" className="block hover:text-white transition-colors">Discord Server</a>
                                <a href="#" className="block hover:text-white transition-colors">Twitter / X</a>
                                <a href="#" className="block hover:text-white transition-colors">YouTube Channel</a>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-black uppercase tracking-widest text-xs text-white mb-8">Support</h5>
                            <div className="space-y-4 text-gray-500 font-bold text-sm">
                                <a href="#" className="block hover:text-white transition-colors">Help Center</a>
                                <a href="#" className="block hover:text-white transition-colors">Release Notes</a>
                                <a href="#" className="block hover:text-white transition-colors">Contact Us</a>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
                        <div className="text-sm text-gray-600 font-bold">
                            © 2024 Hanachan. Build your Japanese dreams.
                        </div>
                        <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-500">
                            <a href="#" className="hover:text-white">Privacy Safety</a>
                            <a href="#" className="hover:text-white">Terms of Use</a>
                            <a href="#" className="hover:text-white">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

