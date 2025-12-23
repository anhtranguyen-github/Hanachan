"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BrainCircuit,
  Sparkles,
  Zap,
  ArrowRight,
  Play,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Layers,
  Target,
  Heart,
  MessageCircle,
  Youtube,
  Search,
  Languages,
  Monitor,
  Wand2,
  History,
  Bookmark
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/AuthContext';
import { BRAND_COLORS } from '@/config/design.config';
import { cn } from '@/lib/utils';
import { SakuraHeader } from '@/components/SakuraHeader';
import { SakuraButton } from '@/components/SakuraButton';

export default function Home() {
  const { isAuthenticated, isAuthResolved } = useAuth();
  const router = useRouter();

  console.log('DEBUG: Hero Render. isAuthResolved:', isAuthResolved, 'isAuthenticated:', isAuthenticated);

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-purple-200">
      <SakuraHeader
        title="Hanachan V2"
        subtitle="SENSORY LEARNING"
        subtitleColor="#10B981"
        actions={
          <div className="flex items-center gap-4">
            {!isAuthResolved ? null : isAuthenticated ? (
              <Link href="/decks" className="px-6 py-2.5 rounded-xl bg-sakura-cocoa text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-sakura-cocoa/20">
                Matrix
              </Link>
            ) : (
              <>
                <Link href="/auth/signin" className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/60 hover:text-sakura-ink transition-colors">
                  Login
                </Link>
                <Link href="/auth/signin" className="px-6 py-2.5 rounded-xl bg-sakura-cocoa text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-sakura-cocoa/20">
                  Begin
                </Link>
              </>
            )}
          </div>
        }
      />

      <main className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-green-600">AI Neural Engine Active</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-sakura-ink uppercase">
              Master the<br />
              <span className="text-sakura-cocoa">Substrate.</span>
            </h1>

            <p className="text-xl text-sakura-ink/60 leading-relaxed max-w-lg font-medium">
              Deep-synthesis Japanese learning. Chat with Hana, deconstruct YouTube narratives, and commit to long-term retrieval.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-6 pt-4">
              <SakuraButton
                variant="primary"
                size="lg"
                icon={TrendingUp}
                onClick={() => router.push(isAuthenticated ? "/dashboard" : "/auth/signin")}
                className="w-full sm:w-auto"
              >
                {isAuthenticated ? "Enter Matrix" : "Begin Sync"}
              </SakuraButton>
              <SakuraButton
                variant="secondary"
                size="lg"
                icon={Youtube}
                onClick={() => router.push("#immersion")}
                className="w-full sm:w-auto"
              >
                Simulate Immersion
              </SakuraButton>
            </div>
          </div>

          {/* Right Visual - Simulating App Interface */}
          <div className="relative">
            <div className="relative rounded-[3rem] bg-white border border-sakura-divider p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-indigo-500 to-purple-600" />

              {/* Fake Chat UI */}
              <div className="space-y-6 mb-10">
                {/* Hana Message */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg">花</div>
                  <div className="bg-sakura-bg-app rounded-[2rem] rounded-tl-none p-6 max-w-[85%] border border-sakura-divider">
                    <p className="font-bold text-base text-sakura-ink leading-relaxed">こんにちは！今日は何を勉強しますか？</p>
                    <div className="mt-2 text-[10px] font-black tracking-widest text-sakura-cocoa/30 uppercase">Neural Stream Active</div>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-12 h-12 rounded-2xl bg-sakura-cocoa flex-shrink-0 flex items-center justify-center text-white font-black shadow-lg">YOU</div>
                  <div className="bg-sakura-cocoa text-white rounded-[2rem] rounded-tr-none p-6 max-w-[85%] shadow-xl shadow-sakura-cocoa/20">
                    <p className="font-bold text-base">Synthesize this YouTube sequence.</p>
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Stats underneath */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-3xl bg-white border border-sakura-divider text-center group transition-all hover:border-purple-200">
                  <p className="text-3xl font-black text-purple-600 mb-1">12</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-sakura-cocoa/40">Reviews</p>
                </div>
                <div className="p-4 rounded-3xl bg-white border border-sakura-divider text-center group transition-all hover:border-green-200">
                  <p className="text-3xl font-black text-green-600 mb-1">5</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-sakura-cocoa/40">Patterns</p>
                </div>
                <div className="p-4 rounded-3xl bg-sakura-ink text-white text-center shadow-lg">
                  <Monitor size={20} className="mx-auto mb-2 text-green-400" />
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Sync</p>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-10 -right-6 px-6 py-4 bg-white border border-sakura-divider rounded-[2rem] flex items-center gap-4 shadow-xl shadow-sakura-cocoa/10 animate-bounce">
              <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40">Precision</p>
                <p className="text-lg font-black text-sakura-ink leading-none">99.8%</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="relative z-10 py-32 px-6 bg-white border-y border-sakura-divider">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black text-sakura-ink mb-6 tracking-tighter uppercase">
              The Architecture of Fluency.
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-0.5 w-16 bg-sakura-cocoa/20" />
              <p className="text-sakura-ink/60 text-xl font-medium max-w-2xl">
                A closed-loop system for acquisition, retention, and deep synthesis.
              </p>
              <div className="h-0.5 w-16 bg-sakura-cocoa/20" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Chat */}
            <div className="group p-10 rounded-[3rem] bg-white border border-sakura-divider hover:border-purple-600/30 transition-all shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/5 text-purple-600 flex items-center justify-center mb-8 border border-purple-600/10 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-sakura-ink mb-4 uppercase tracking-tighter">Hana Assistant</h3>
              <p className="text-sakura-ink/60 leading-relaxed font-medium">
                Practice roleplays, ask for cultural nuances, or deconstruct syntax. Hana is your 24/7 neural tutor.
              </p>
            </div>

            {/* Feature 2: Analyzer */}
            <div className="group p-10 rounded-[3rem] bg-white border border-sakura-divider hover:border-green-600/30 transition-all shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-green-600/5 text-green-600 flex items-center justify-center mb-8 border border-green-600/10 group-hover:bg-green-600 group-hover:text-white transition-all">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-black text-sakura-ink mb-4 uppercase tracking-tighter">Visual Parser</h3>
              <p className="text-sakura-ink/60 leading-relaxed font-medium">
                Instant substrate breakdown. We map particles, kanji density, and grammar patterns in a single view.
              </p>
            </div>

            {/* Feature 3: SRS */}
            <div className="group p-10 rounded-[3rem] bg-white border border-sakura-divider hover:border-indigo-600/30 transition-all shadow-sm hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/5 text-indigo-600 flex items-center justify-center mb-8 border border-indigo-600/10 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <BrainCircuit size={32} />
              </div>
              <h3 className="text-2xl font-black text-sakura-ink mb-4 uppercase tracking-tighter">Retrieval Matrix</h3>
              <p className="text-sakura-ink/60 leading-relaxed font-medium">
                Never lose a token. Our SRS engine manages your cognitive load for maximum retention efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="immersion" className="relative py-40 px-6 bg-sakura-bg-app">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-video bg-sakura-ink rounded-[3rem] shadow-2xl flex items-center justify-center relative overflow-hidden border border-sakura-divider">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <Image
                  src="/flower_bg.png"
                  width={800}
                  height={600}
                  alt="Background"
                  className="absolute inset-0 opacity-40 object-cover"
                />
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-sakura-ink relative z-20 shadow-xl border-4 border-white">
                  <Play size={32} fill="currentColor" />
                </div>

                {/* Subtitles Overlay */}
                <div className="absolute bottom-10 left-10 right-10 z-30 text-center">
                  <div className="bg-white p-6 rounded-[2rem] border border-sakura-divider shadow-xl">
                    <p className="text-3xl font-black text-sakura-ink mb-1">日本語を<span className="text-green-600">勉強</span>しましょう</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40">Neural Synthesis Active</p>
                  </div>
                </div>
              </div>

              {/* Extracted Vocab Card Floating */}
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-[2rem] shadow-2xl border border-sakura-divider max-w-[240px] animate-bounce">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20"><BookOpen size={20} /></div>
                  <div>
                    <p className="font-black text-xl text-sakura-ink">勉強</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40">Study [Noun/Verb]</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-red-600/5 border border-red-600/10">
                <Youtube className="w-4 h-4 text-red-600" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-red-600">YouTube Synthesis</span>
              </div>
              <h2 className="text-6xl font-black text-sakura-ink tracking-tighter uppercase leading-[0.9]">Turn Narrative Into Knowledge.</h2>
              <p className="text-xl text-sakura-ink/60 leading-relaxed font-medium">
                Don&apos;t just watch—synthesize. Hanachan extracts linguistics from any YouTube sequence, creating an instant retrieval path for your matrix.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {[
                  { label: 'Neural Extraction', icon: CheckCircle2 },
                  { label: 'One-Click Matrix', icon: Bookmark },
                  { label: 'Contextual Flow', icon: Zap },
                  { label: 'Shadow Sync', icon: MessageCircle }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-xl bg-sakura-bg-app border border-sakura-divider flex items-center justify-center flex-shrink-0 group-hover:bg-sakura-cocoa group-hover:text-white transition-all">
                      <item.icon size={16} />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest text-sakura-ink">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <Link
                  href="/immersion"
                  className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl bg-sakura-ink text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-2xl"
                >
                  Launch Immersion Library <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Sync Card */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-16 rounded-[4rem] bg-sakura-ink text-white relative overflow-hidden shadow-2xl">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-sakura-cocoa/10 rounded-full -mr-32 -mb-32" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h3 className="text-5xl font-black mb-6 uppercase tracking-tighter">Unified Substrate.</h3>
                <p className="text-white/60 text-xl leading-relaxed mb-10 font-medium">
                  Covering 6,000+ lexical tokens across all JLPT tiers. Sync your matrix and master the language.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">2k Kanji</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <BookOpen className="w-5 h-5 text-green-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">6k Words</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">800 Patterns</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-10 rounded-[2.5rem] bg-white text-sakura-ink shadow-xl">
                  <p className="text-5xl font-black mb-1">N1-N5</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tier Range</p>
                </div>
                <div className="p-10 rounded-[2.5rem] bg-sakura-cocoa text-white shadow-xl">
                  <Heart size={40} className="mb-4 text-red-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Loved by Learners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Sync */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-[4rem] bg-white border border-sakura-divider p-20 text-center shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sakura-bg-app rounded-full -mr-16 -mt-16" />
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-sakura-cocoa/5 text-sakura-cocoa mb-10">
              <Sparkles size={40} />
            </div>

            <h2 className="text-6xl font-black text-sakura-ink mb-6 tracking-tighter uppercase">Sync to Matrix.</h2>
            <p className="text-sakura-ink/60 text-xl mb-12 max-w-xl mx-auto font-medium">
              The high-fidelity path to Japanese fluency. Zero friction. Total immersion.
            </p>

            <Link
              href={isAuthenticated ? "/decks" : "/auth/signin"}
              className="inline-flex items-center gap-4 px-12 py-6 rounded-[2.5rem] bg-sakura-cocoa text-white font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-sakura-cocoa/20"
            >
              {isAuthenticated ? "Enter Matrix" : "Begin Sync"} <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 px-6 border-t border-sakura-divider">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sakura-cocoa flex items-center justify-center">
                  <span className="font-black text-white text-lg">花</span>
                </div>
                <span className="text-xl font-black text-sakura-ink">Hanachan</span>
              </div>
              <p className="text-sakura-cocoa/40 leading-relaxed max-w-sm font-medium">
                The AI-powered Japanese learning platform designed for immersion and retention.
              </p>
            </div>

            <div className="md:col-span-8 grid grid-cols-3 gap-8">
              <div>
                <h4 className="font-black text-sakura-ink mb-4 uppercase tracking-widest text-xs">Features</h4>
                <ul className="space-y-3 text-sm text-sakura-cocoa/40">
                  <li><a href="#features" className="hover:text-sakura-cocoa transition-colors">AI Chat</a></li>
                  <li><a href="#immersion" className="hover:text-sakura-cocoa transition-colors">YouTube Immersion</a></li>
                  <li><a href="#" className="hover:text-sakura-cocoa transition-colors">SRS</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-sakura-ink mb-4 uppercase tracking-widest text-xs">Resources</h4>
                <ul className="space-y-3 text-sm text-sakura-cocoa/40">
                  <li><a href="#" className="hover:text-sakura-cocoa transition-colors">Grammar Guide</a></li>
                  <li><a href="#" className="hover:text-sakura-cocoa transition-colors">Learning Path</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-sakura-ink mb-4 uppercase tracking-widest text-xs">Legal</h4>
                <ul className="space-y-3 text-sm text-sakura-cocoa/40">
                  <li><a href="#" className="hover:text-sakura-cocoa transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-sakura-cocoa transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-sakura-divider flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-sakura-text-muted">
              © {new Date().getFullYear()} Hanachan. Made with 💖 for Japanese learners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
