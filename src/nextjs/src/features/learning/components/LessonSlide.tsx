'use client';

import React from 'react';
import { ChevronRight, Layers, BookOpen, Zap, Hash, Globe, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-300 mb-1.5">
            {children}
        </p>
    );
}

function InfoTile({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={clsx('bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3', className)}>
            <SectionLabel>{label}</SectionLabel>
            {children}
        </div>
    );
}

function ExampleRow({ ja, en, index }: { ja: string; en?: string; index: number }) {
    return (
        <div className="relative pl-4 border-l-2 border-gray-100 space-y-0.5 hover:border-primary/40 transition-colors">
            <p className="text-sm font-black text-gray-400 absolute -left-2 -top-0.5 w-3 text-[8px]">
                {index + 1}
            </p>
            <p className="text-base font-bold text-gray-800 jp-text leading-relaxed">{ja}</p>
            {en && <p className="text-sm text-gray-400 leading-snug italic">&quot;{en}&quot;</p>}
        </div>
    );
}

// ─── RADICAL Slide ─────────────────────────────────────────────────────────────

function RadicalSlide({ subject }: { subject: SubjectResource }) {
    const d = subject.data;
    const mnemonic = d.meaning_mnemonic;

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Memory Hook */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-3xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Zap size={13} className="text-[#2A6FA8]" />
                        </div>
                        <SectionLabel>Memory Hook</SectionLabel>
                    </div>
                    {mnemonic ? (
                        <p className="text-base text-gray-700 leading-relaxed font-medium">{mnemonic}</p>
                    ) : (
                        <p className="text-base text-gray-500 leading-relaxed font-medium italic">
                            Imagine the shape of <strong className="text-[#2A6FA8] not-italic">{d.characters || d.meanings[0]?.meaning}</strong> as its name suggests.
                        </p>
                    )}
                </div>

                <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-2xl bg-white">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Hash size={14} className="text-[#2A6FA8]" />
                    </div>
                    <div>
                        <SectionLabel>What is a Radical?</SectionLabel>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Radicals are visual components. Knowing <strong className="text-gray-800">{d.meanings[0]?.meaning}</strong> helps you recognize kanji.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── KANJI Slide ───────────────────────────────────────────────────────────────

function KanjiSlide({ subject }: { subject: SubjectResource }) {
    const d = subject.data;
    const onReadings = d.readings.filter(r => r.type === 'onyomi').map(r => r.reading);
    const kunReadings = d.readings.filter(r => r.type === 'kunyomi').map(r => r.reading);
    const meaningMnemonic = d.meaning_mnemonic;
    const readingMnemonic = d.reading_mnemonic;

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="On'yomi">
                        <div className="flex flex-wrap gap-1.5">
                            {onReadings.length > 0 ? onReadings.map((r, i) => (
                                <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-xl text-lg font-black text-[#B5375A] jp-text">{r}</span>
                            )) : <span className="text-xl font-black text-gray-300 jp-text">—</span>}
                        </div>
                    </InfoTile>
                    <InfoTile label="Kun'yomi">
                        <div className="flex flex-wrap gap-1.5">
                            {kunReadings.length > 0 ? kunReadings.map((r, i) => (
                                <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-700 jp-text">{r}</span>
                            )) : <span className="text-xl font-black text-gray-300 jp-text">—</span>}
                        </div>
                    </InfoTile>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-3xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-rose-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={13} className="text-[#B5375A]" />
                        </div>
                        <SectionLabel>Meaning Mnemonic</SectionLabel>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed font-medium">{meaningMnemonic}</p>
                </div>

                {readingMnemonic && (
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Globe size={13} className="text-gray-500" />
                            </div>
                            <SectionLabel>Reading Mnemonic</SectionLabel>
                        </div>
                        <p className="text-base text-gray-600 leading-relaxed font-medium">{readingMnemonic}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── VOCABULARY Slide ──────────────────────────────────────────────────────────

function VocabularySlide({ subject }: { subject: SubjectResource }) {
    const d = subject.data;
    const reading = d.readings[0]?.reading || '';
    const meaningMnemonic = d.meaning_mnemonic;
    const readingMnemonic = d.reading_mnemonic;

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-3xl p-5">
                    <SectionLabel>Reading</SectionLabel>
                    <p className="text-4xl font-black text-[#5A2D8A] jp-text leading-tight mb-3">{reading || '—'}</p>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-3xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-violet-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={13} className="text-violet-600" />
                        </div>
                        <SectionLabel>Meaning Mnemonic</SectionLabel>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed font-medium">{meaningMnemonic}</p>
                </div>

                {readingMnemonic && (
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-2">
                        <SectionLabel>Reading Mnemonic</SectionLabel>
                        <p className="text-base text-gray-600 leading-relaxed font-medium">{readingMnemonic}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main export ───────────────────────────────────────────────────────────────

import { AssignmentResource, SubjectResource } from '@/types/wanikani';

export interface LessonSlideProps {
    item: AssignmentResource; // Now always an assignment with sub-subject
    onNext: () => void;
    isLastLesson: boolean;
}

const TYPE_CONFIG: Record<string, { heroBg: string; accent: string; accentText: string; charColor: string; typeLabel: string }> = {
    radical:    { heroBg: 'from-[#EBF5FF] to-[#DBEEFF]', accent: 'bg-[#A2D2FF]', accentText: 'text-[#2A6FA8]', charColor: 'text-[#2A6FA8]',   typeLabel: 'Radical' },
    kanji:      { heroBg: 'from-[#FFF0F3] to-[#FFE4EA]', accent: 'bg-[#F4ACB7]', accentText: 'text-[#B5375A]', charColor: 'text-[#8B2240]',   typeLabel: 'Kanji'   },
    vocabulary: { heroBg: 'from-[#F5F0FF] to-[#EDE6FF]', accent: 'bg-[#CDB4DB]', accentText: 'text-[#7A4DAA]', charColor: 'text-[#5A2D8A]',   typeLabel: 'Vocab'   },
    grammar:    { heroBg: 'from-[#F0FFF6] to-[#E0FFED]', accent: 'bg-[#B7E4C7]', accentText: 'text-[#2D7A4D]', charColor: 'text-[#1A5E36]',   typeLabel: 'Grammar' },
};

export function LessonSlide({ item, onNext, isLastLesson }: LessonSlideProps) {
    const subject = item.data.subject;
    if (!subject) return null;

    const cfg = TYPE_CONFIG[subject.object] || TYPE_CONFIG.kanji;
    const d = subject.data;

    const heroReading = (subject.object === 'vocabulary' || subject.object === 'kanji')
        ? d.readings[0]?.reading
        : null;

    const charDisplay = d.characters || d.slug;
    const isLongPattern = charDisplay && charDisplay.length > 4;

    return (
        <div className="flex-1 flex flex-col overflow-hidden w-full animate-in fade-in duration-400">

            {/* ── COMPACT HERO ── */}
            <div className={clsx(
                'w-full flex flex-col items-center justify-center relative shrink-0 bg-gradient-to-b',
                'pt-6 pb-5 sm:pt-7 sm:pb-6 min-h-[28vh] sm:min-h-[32vh]',
                cfg.heroBg
            )}>
                {/* Type + Level badge */}
                <div className="absolute top-3 left-4">
                    <span className={clsx(
                        'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.18em]',
                        cfg.accentText, 'bg-white/60 backdrop-blur-sm border border-white/40'
                    )}>
                        {cfg.typeLabel} · Lv {subject.data.level}
                    </span>
                </div>
                <div className="absolute top-3 right-4">
                    <span className="px-2.5 py-1 bg-black/5 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">New</span>
                </div>

                {/* Main content */}
                <div className="flex flex-col items-center gap-1 mt-3 px-4 text-center">
                    <h2 className={clsx(
                        'font-black jp-text leading-tight drop-shadow-sm',
                        isLongPattern ? 'text-3xl sm:text-4xl max-w-xs' : 'text-[4rem] sm:text-[5.5rem] leading-none',
                        cfg.charColor
                    )}>
                        {charDisplay}
                    </h2>
                    {heroReading && (
                        <p className="text-base sm:text-lg font-bold text-gray-500 jp-text tracking-wide">{heroReading}</p>
                    )}
                    <p className={clsx('text-base sm:text-xl font-black tracking-tight', cfg.accentText)}>
                        {d.meanings[0]?.meaning}
                    </p>
                </div>

                <div className={clsx('absolute bottom-0 left-0 right-0 h-0.5', cfg.accent)} />
            </div>

            {/* ── TYPE-SPECIFIC CONTENT ── */}
            {subject.object === 'radical'    && <RadicalSlide    subject={subject} />}
            {subject.object === 'kanji'      && <KanjiSlide      subject={subject} />}
            {subject.object === 'vocabulary' && <VocabularySlide subject={subject} />}

            {/* ── STICKY FOOTER CTA ── */}
            <footer className="w-full shrink-0 px-4 sm:px-6 py-3.5 bg-white border-t border-gray-100 flex items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 hidden sm:block">
                    {isLastLesson ? 'Last item — quiz starts next!' : 'Read carefully before continuing'}
                </p>
                <button
                    onClick={onNext}
                    data-testid="lesson-next-button"
                    className={clsx(
                        'ml-auto px-7 sm:px-10 py-3 text-white font-black rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center gap-2',
                        isLastLesson
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600'
                            : 'bg-gray-900 hover:bg-gray-700',
                    )}
                >
                    {isLastLesson ? '✦ Start Quiz' : 'Next'}
                    <ChevronRight size={15} />
                </button>
            </footer>
        </div>
    );
}

