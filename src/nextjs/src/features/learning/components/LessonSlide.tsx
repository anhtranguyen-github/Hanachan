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
// Layout: Big visual center, meaning name prominent, memory hook below

function RadicalSlide({ item }: { item: any }) {
    const d = item.ku_radicals || item.radical_details || {};
    const mnemonic = d.mnemonic_story || item.mnemonics?.meaning?.content || item.mnemonics?.meaning || item.mnemonics?.text;
    const usedInKanji: any[] = item.kanji || [];

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Memory Hook — most important for radicals */}
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
                            Imagine the shape of <strong className="text-[#2A6FA8] not-italic">{item.character || item.meaning}</strong> as its name suggests. Radicals are the building blocks of all kanji.
                        </p>
                    )}
                </div>

                {/* Role explanation */}
                <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-2xl bg-white">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Hash size={14} className="text-[#2A6FA8]" />
                    </div>
                    <div>
                        <SectionLabel>What is a Radical?</SectionLabel>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Radicals are the base visual components that make up kanji. Knowing <strong className="text-gray-800">{item.meaning}</strong> helps you recognize and memorize the kanji it appears in.
                        </p>
                    </div>
                </div>

                {/* Kanji that use this radical */}
                {usedInKanji.length > 0 && (
                    <div>
                        <SectionLabel>Appears in {usedInKanji.length} Kanji</SectionLabel>
                        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                            {usedInKanji.slice(0, 14).map((k: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl bg-gray-50 border border-gray-100 aspect-square"
                                >
                                    <span className="text-xl font-black text-[#2A6FA8] jp-text leading-none">{k.character}</span>
                                    <span className="text-[7px] font-black text-gray-300 uppercase tracking-wide text-center truncate w-full px-0.5">{k.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tip */}
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                    <BookOpen size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">
                        <strong>Tip:</strong> You won&apos;t be quizzed on reading for radicals — only meaning. Focus on the story.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── KANJI Slide ───────────────────────────────────────────────────────────────
// Layout: Readings prominent, then meaning mnemonic, reading mnemonic, component radicals

function KanjiSlide({ item }: { item: any }) {
    const d = item.ku_kanji || item.kanji_details?.[0] || {};
    const onReadings: string[] = (d.reading_onyomi?.split('、').filter(Boolean)) || item.onReadings || [];
    const kunReadings: string[] = (d.reading_kunyomi?.split('、').filter(Boolean)) || item.kunReadings || [];
    const meaningMnemonic = d.meaning_explanation || item.mnemonics?.meaning;
    const readingMnemonic = d.reading_explanation || item.mnemonics?.reading;
    const radicals: any[] = item.radicals || [];
    const vocab: any[] = item.vocabulary || [];

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Readings — central for kanji */}
                <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="On'yomi (Chinese)">
                        {onReadings.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {onReadings.map((r, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-xl text-lg font-black text-[#B5375A] jp-text">
                                        {r.trim()}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xl font-black text-gray-300 jp-text">—</span>
                        )}
                    </InfoTile>
                    <InfoTile label="Kun'yomi (Japanese)">
                        {kunReadings.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {kunReadings.map((r, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-700 jp-text">
                                        {r.trim()}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xl font-black text-gray-300 jp-text">—</span>
                        )}
                    </InfoTile>
                </div>

                {/* Meaning mnemonic */}
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-3xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-rose-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={13} className="text-[#B5375A]" />
                        </div>
                        <SectionLabel>Meaning Story</SectionLabel>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed font-medium">
                        {meaningMnemonic || `Picture what "${item.meaning}" looks like visually. Trace the strokes of ${item.character} and connect them to the meaning.`}
                    </p>
                </div>

                {/* Reading mnemonic */}
                {readingMnemonic && (
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Globe size={13} className="text-gray-500" />
                            </div>
                            <SectionLabel>Reading Story</SectionLabel>
                        </div>
                        <p className="text-base text-gray-600 leading-relaxed font-medium">{readingMnemonic}</p>
                    </div>
                )}

                {/* Component Radicals */}
                {radicals.length > 0 && (
                    <div>
                        <SectionLabel>Built from {radicals.length} Radical{radicals.length !== 1 ? 's' : ''}</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {radicals.map((r: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <span className="text-xl font-black text-[#2A6FA8] jp-text leading-none">{r.character}</span>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Radical</p>
                                        <p className="text-xs font-bold text-[#2A6FA8]">{r.meaning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related vocabulary preview */}
                {vocab.length > 0 && (
                    <div>
                        <SectionLabel>Vocabulary Using {item.character}</SectionLabel>
                        <div className="space-y-1.5">
                            {vocab.slice(0, 4).map((v: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <span className="text-xl font-black text-[#8B2240] jp-text leading-none shrink-0">{v.character}</span>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 jp-text">{v.reading || v.reading_primary}</p>
                                        <p className="text-sm font-bold text-gray-600 truncate">{v.meaning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── VOCABULARY Slide ──────────────────────────────────────────────────────────
// Layout: Reading front-and-center, POS tags, meaning mnemonic, examples, kanji breakdown

function VocabularySlide({ item }: { item: any }) {
    const d = item.ku_vocabulary || item.vocabulary_details?.[0] || {};
    const reading = d.reading_primary || d.reading || item.readings?.[0] || '';
    const pitch = d.pitch_accent_data || d.pitch;
    const posTags: string[] = d.parts_of_speech || [];
    const meaningMnemonic = d.meaning_data?.explanation || item.mnemonics?.meaning;
    const readingMnemonic = d.reading_data?.explanation || item.mnemonics?.reading;
    const sentences: any[] = item.sentences || [];
    const components: any[] = item.kanji || [];

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Reading + POS */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-3xl p-5">
                    <SectionLabel>Reading</SectionLabel>
                    <p className="text-4xl font-black text-[#5A2D8A] jp-text leading-tight mb-3">{reading || '—'}</p>
                    {posTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {posTags.map((pos, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white/70 border border-violet-200 rounded-xl text-[9px] font-black text-violet-600 uppercase tracking-wide">
                                    {pos}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Kanji components */}
                {components.length > 0 && (
                    <div>
                        <SectionLabel>Kanji Components</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {components.map((k: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-2xl">
                                    <span className="text-2xl font-black text-[#8B2240] jp-text leading-none">{k.character}</span>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-300">Kanji</p>
                                        <p className="text-xs font-bold text-[#8B2240]">{k.meaning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Meaning mnemonic */}
                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-3xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-violet-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={13} className="text-violet-600" />
                        </div>
                        <SectionLabel>Memory Story</SectionLabel>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed font-medium">
                        {meaningMnemonic || `The word ${item.character} (${reading}) means "${item.meaning}". Try to create a vivid image that connects the reading to the meaning.`}
                    </p>
                </div>

                {/* Reading mnemonic */}
                {readingMnemonic && (
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-2">
                        <SectionLabel>Reading Memory Trick</SectionLabel>
                        <p className="text-base text-gray-600 leading-relaxed font-medium">{readingMnemonic}</p>
                    </div>
                )}

                {/* Example sentences */}
                {sentences.length > 0 ? (
                    <div>
                        <SectionLabel>Example Sentences</SectionLabel>
                        <div className="space-y-4">
                            {sentences.slice(0, 3).map((s: any, i: number) => (
                                <ExampleRow key={i} ja={s.ja} en={s.en} index={i} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-200 rounded-2xl">
                        <span className="text-gray-200 text-lg jp-text">文</span>
                        <p className="text-sm text-gray-300 italic">
                            Try writing your own sentence using <strong className="text-gray-400 not-italic">{item.character}</strong>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── GRAMMAR Slide ─────────────────────────────────────────────────────────────
// Layout: Wide pattern display, explanation, structure variants, 2-3 example sentences

function GrammarSlide({ item }: { item: any }) {
    const d = item.ku_grammar || item.grammar_details?.[0] || {};
    const explanation = d.explanation || item.mnemonics?.meaning;
    const structure = item.structure || {};
    const variants = structure.variants ? Object.entries(structure.variants).filter(([, v]) => v) : [];
    const sentences: any[] = item.sentences || [];
    const related: any[] = item.related_grammar || [];

    return (
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Explanation */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-3xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Zap size={13} className="text-[#2D7A4D]" />
                        </div>
                        <SectionLabel>How It Works</SectionLabel>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed font-medium">
                        {explanation || `${item.character || item.meaning} is a grammar pattern used to express specific nuances in Japanese. Study the examples below carefully.`}
                    </p>
                </div>

                {/* Structure variants */}
                {variants.length > 0 && (
                    <div>
                        <SectionLabel>Structure</SectionLabel>
                        <div className="space-y-2">
                            {variants.slice(0, 4).map(([name, code]: [string, any]) => {
                                const patterns = typeof code === 'string'
                                    ? { [name]: code }
                                    : (code && typeof code === 'object' ? code : {});
                                return Object.entries(patterns).map(([subName, html]: [string, any]) => (
                                    <div key={subName} className="rounded-2xl border border-gray-100 overflow-hidden">
                                        {subName !== 'standard' && subName !== name && (
                                            <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-100">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#2D7A4D]">{subName}</span>
                                            </div>
                                        )}
                                        <div
                                            className="px-4 py-3 text-base font-black text-gray-800 jp-text leading-relaxed bg-gray-50"
                                            dangerouslySetInnerHTML={{ __html: html }}
                                        />
                                    </div>
                                ));
                            })}
                        </div>
                    </div>
                )}

                {/* Example sentences */}
                {sentences.length > 0 ? (
                    <div>
                        <SectionLabel>Example Sentences ({sentences.length})</SectionLabel>
                        <div className="space-y-4">
                            {sentences.slice(0, 4).map((s: any, i: number) => (
                                <ExampleRow key={i} ja={s.ja} en={s.en} index={i} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-200 rounded-2xl">
                        <Layers size={14} className="text-gray-200 shrink-0" />
                        <p className="text-sm text-gray-300 italic">
                            Try composing a sentence using <strong className="text-gray-400 not-italic">{item.character || item.meaning}</strong>.
                        </p>
                    </div>
                )}

                {/* Related grammar (compact) */}
                {related.length > 0 && (
                    <div>
                        <SectionLabel>Related Grammar</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                            {related.slice(0, 5).map((relObj: any, i: number) => {
                                const r = relObj.related || relObj;
                                return (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                                        <span className="text-sm font-black text-[#2D7A4D] jp-text">{r.character || r.meaning}</span>
                                        {r.meaning !== r.character && (
                                            <span className="text-[9px] font-bold text-gray-400">{r.meaning}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export interface LessonSlideProps {
    item: any;
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
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.kanji;

    // Reading for hero
    const d = item.ku_vocabulary || item.vocabulary_details?.[0] || item.ku_kanji || item.kanji_details?.[0] || {};
    const heroReading = item.type === 'vocabulary'
        ? (d.reading_primary || d.reading || item.readings?.[0])
        : item.type === 'kanji'
        ? (d.reading_onyomi?.split('、')[0] || (item.onReadings && item.onReadings[0]))
        : null;

    // Character display (grammar might be a long pattern)
    const charDisplay = item.character || item.slug?.split(':')?.[1];
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
                        {cfg.typeLabel} · Lv {item.level}
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
                        {item.meaning}
                    </p>
                </div>

                <div className={clsx('absolute bottom-0 left-0 right-0 h-0.5', cfg.accent)} />
            </div>

            {/* ── TYPE-SPECIFIC CONTENT ── */}
            {item.type === 'radical'    && <RadicalSlide    item={item} />}
            {item.type === 'kanji'      && <KanjiSlide      item={item} />}
            {item.type === 'vocabulary' && <VocabularySlide item={item} />}
            {item.type === 'grammar'    && <GrammarSlide    item={item} />}

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
