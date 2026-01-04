
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import {
    ArrowLeft,
    BookOpen,
    ExternalLink,
    Zap,
    Layers,
    Flame,
    RefreshCcw,
    Bookmark,
    Volume2,
    Plus,
    Info,
    ChevronRight,
    Star,
    Share2,
    Book,
    Lightbulb,
    Type,
    Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/services/supabase/client';
import { useUser } from '@/features/auth/AuthContext';

interface KUDetail {
    slug: string;
    character: string;
    meaning: string;
    level: number;
    type: string;
    state?: string;
    meaning_data?: any;
    reading_data?: any;
    meaning_story?: string;
    reading_story?: string;
    structure_json?: any;
    examples?: any[];
    // For Kanji
    onyomi?: string[];
    kunyomi?: string[];
    // For Vocab
    primary_reading?: string;
    audio_assets?: any;
    // For Grammar
    grammar_metadata?: any;
}

export function KUDetailView({ slug, type }: { slug: string, type: string }) {
    const router = useRouter();
    const supabase = createClient();
    const { user } = useUser();
    const [data, setData] = useState<KUDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'meaning' | 'reading' | 'practice'>('meaning');

    const fullSlug = `${type}/${slug}`;

    useEffect(() => {
        const fetchDetail = async () => {
            if (!user) return;
            setLoading(true);

            // 1. Fetch Knowledge Unit Core
            const { data: ku, error } = await supabase
                .from('knowledge_units')
                .select(`
                    slug, character, search_key, meaning, level, type,
                    ku_kanji (meaning_data, reading_data, metadata),
                    ku_vocabulary (reading_primary, meaning_data, audio_assets, metadata),
                    ku_radicals (name, meaning_story, metadata),
                    ku_grammar (title, meaning_summary, meaning_story, structure_json, metadata)
                `)
                .eq('slug', fullSlug)
                .single();

            if (ku) {
                // 2. Fetch User State
                const { data: stateData } = await supabase
                    .from('user_learning_states')
                    .select('state')
                    .eq('user_id', user.id)
                    .eq('ku_id', fullSlug)
                    .maybeSingle();

                let meaning = ku.meaning || ku.search_key || '';
                let onyx = [], kunx = [], primaryR = '';
                let examples = [];
                let gramMeta = null;
                let meaningStory = '';
                let readingStory = '';
                let structureJson = null;

                if (ku.type === 'kanji' && ku.ku_kanji?.[0]) {
                    const k = ku.ku_kanji[0];
                    meaning = meaning || k.meaning_data?.meanings?.[0] || '';
                    onyx = k.reading_data?.onyomi || [];
                    kunx = k.reading_data?.kunyomi || [];
                    meaningStory = k.metadata?.meaning_mnemonic || '';
                    readingStory = k.metadata?.reading_mnemonic || '';
                } else if (ku.type === 'vocabulary' && ku.ku_vocabulary?.[0]) {
                    const v = ku.ku_vocabulary[0];
                    meaning = meaning || v.meaning_data?.meanings?.[0] || '';
                    primaryR = v.reading_primary || '';
                    meaningStory = v.metadata?.meaning_mnemonic || '';
                    readingStory = v.metadata?.reading_mnemonic || '';
                } else if (ku.type === 'radical' && ku.ku_radicals?.[0]) {
                    const r = ku.ku_radicals[0];
                    meaning = meaning || r.name || '';
                    meaningStory = r.meaning_story || '';
                } else if (ku.type === 'grammar' && ku.ku_grammar?.[0]) {
                    const g = ku.ku_grammar[0];
                    meaning = meaning || g.meaning_summary || g.title || '';
                    gramMeta = g.metadata;
                    examples = g.metadata?.examples || [];
                    meaningStory = g.meaning_story || '';
                    structureJson = g.structure_json;
                }

                // 3. Fetch Examples (Sentences) from Junction table
                const { data: exampleData } = await supabase
                    .from('ku_to_sentence')
                    .select(`
                        sentence_id,
                        sentences (id, text_ja, text_en)
                    `)
                    .eq('ku_id', fullSlug)
                    .limit(5);

                if (exampleData) {
                    const fetchedExamples = exampleData
                        .filter((item: any) => item.sentences)
                        .map((item: any) => ({
                            jp: item.sentences.text_ja,
                            en: item.sentences.text_en,
                            id: item.sentences.id
                        }));

                    // Filter out duplicates if any (merging metadata examples with DB sentences)
                    const existingTexts = new Set(examples.map(e => e.jp || e.japanese));
                    fetchedExamples.forEach(fe => {
                        if (!existingTexts.has(fe.jp)) {
                            examples.push(fe);
                        }
                    });
                }

                setData({
                    ...ku,
                    meaning,
                    onyomi: onyx,
                    kunyomi: kunx,
                    primary_reading: primaryR,
                    state: stateData?.state || 'new',
                    grammar_metadata: gramMeta,
                    meaning_story: meaningStory,
                    reading_story: readingStory,
                    structure_json: structureJson,
                    examples
                });
            }
            setLoading(false);
        };

        fetchDetail();
    }, [fullSlug, user, supabase]);

    if (loading) return <LoadingSkeleton />;
    if (!data) return <NotFoundState onBack={() => router.back()} />;

    const stageColors = {
        learning: "from-blue-500 to-indigo-600 shadow-blue-200",
        review: "from-purple-500 to-fuchsia-600 shadow-purple-200",
        relearning: "from-amber-400 to-orange-600 shadow-amber-200",
        burned: "from-slate-700 to-slate-900 shadow-slate-300",
        new: "from-slate-100 to-slate-200 shadow-slate-100"
    }[data.state || 'new'];

    const ProgressIcon = {
        learning: Zap,
        review: Layers,
        relearning: RefreshCcw,
        burned: Flame,
        new: Star
    }[data.state || 'new'];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Top Navigation */}
            <div className="flex items-center justify-between py-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>LIBRARY</span>
                            <ChevronRight size={10} />
                            <span className="text-rose-500">{data.type}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 mt-0.5">{data.character || data.slug.split('/').pop()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ActionButton icon={Share2} />
                    <ActionButton icon={Bookmark} />
                </div>
            </div>

            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Visual Character Sidebar */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col items-center xl:items-start gap-8">
                    <div className="group relative w-full max-w-[400px] aspect-square rounded-[64px] bg-white border border-slate-100 flex flex-col items-center justify-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 hover:border-rose-200 overflow-hidden">
                        {/* Elegant background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-40"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -ml-32 -mb-32 opacity-40"></div>

                        <div className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-xl shadow-rose-200 flex items-center justify-center text-white scale-90 group-hover:scale-110 transition-transform duration-500 z-20">
                            <ProgressIcon size={24} />
                        </div>

                        {data.primary_reading && (
                            <span className="text-2xl font-bold text-slate-300 font-japanese tracking-[0.2em] mb-4 z-10 transition-colors group-hover:text-rose-300">
                                {data.primary_reading}
                            </span>
                        )}

                        <span className={cn(
                            "font-black font-japanese text-slate-900 leading-none drop-shadow-sm z-10 selection:bg-rose-100",
                            (data.character?.length || 0) > 4 ? "text-5xl" : (data.character?.length || 0) > 2 ? "text-7xl" : "text-9xl"
                        )}>
                            {data.character || data.slug.split('/').pop()}
                        </span>

                        <div className="mt-12 flex gap-4 z-10">
                            <Button className="rounded-full bg-slate-900 text-white font-black text-[10px] tracking-widest px-8 h-12 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:translate-y-[-2px]">
                                <Plus size={16} className="mr-2" /> ADD TO DECK
                            </Button>
                            {data.primary_reading && (
                                <button className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all shadow-sm">
                                    <Volume2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Basic Info Tags */}
                    <div className="flex flex-wrap gap-4 justify-center xl:justify-start">
                        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                            <Type size={16} className="text-rose-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{data.type} ITEM</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <Hash size={16} className="text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">LEVEL {data.level}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-10">
                    <div>
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-4">
                            {data.meaning}
                        </h1>
                        <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
                            {data.type === 'grammar'
                                ? "Master the nuances of this grammar pattern to reach native-like fluency."
                                : `Learn the essence and usage of this ${data.type} unit.`}
                        </p>
                    </div>

                    {/* Section Selector */}
                    <div className="flex gap-2 p-2 bg-slate-100/50 rounded-[28px] w-fit backdrop-blur-sm">
                        <TabItem active={activeSection === 'meaning'} onClick={() => setActiveSection('meaning')} label="Meaning" />
                        {(data.onyomi?.length || data.kunyomi?.length || data.primary_reading) ? (
                            <TabItem active={activeSection === 'reading'} onClick={() => setActiveSection('reading')} label="Reading" />
                        ) : null}
                        {data.examples?.length ? (
                            <TabItem active={activeSection === 'practice'} onClick={() => setActiveSection('practice')} label="Practice" />
                        ) : null}
                    </div>

                    {/* Content sections */}
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        {activeSection === 'meaning' && (
                            <div className="space-y-10">
                                {/* Specialized Content per Type */}
                                {data.type === 'radical' && <RadicalContent data={data} />}
                                {data.type === 'kanji' && <KanjiContent data={data} />}
                                {data.type === 'vocabulary' && <VocabularyContent data={data} />}
                                {data.type === 'grammar' && <GrammarContent data={data} />}

                                {/* Mnemonic Section (Meaning Story) */}
                                {data.meaning_story && (
                                    <DetailCard title="Mnemonic & Story" icon={Lightbulb} color="rose">
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-lg text-slate-600 leading-loose font-medium whitespace-pre-wrap">
                                                {data.meaning_story}
                                            </p>
                                        </div>
                                    </DetailCard>
                                )}
                            </div>
                        )}

                        {activeSection === 'reading' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {data.type === 'kanji' ? (
                                        <>
                                            <DetailCard title="Onyomi (Chinese Reading)" icon={Volume2}>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {data.onyomi && data.onyomi.length > 0 ? (
                                                        data.onyomi.map((r, i) => (
                                                            <ReadingItem key={i} reading={r} />
                                                        ))
                                                    ) : (
                                                        <p className="text-slate-400 text-sm italic py-4">No Onyomi readings found.</p>
                                                    )}
                                                </div>
                                            </DetailCard>
                                            <DetailCard title="Kunyomi (Japanese Reading)" icon={Volume2}>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {data.kunyomi && data.kunyomi.length > 0 ? (
                                                        data.kunyomi.map((r, i) => (
                                                            <ReadingItem key={i} reading={r} />
                                                        ))
                                                    ) : (
                                                        <p className="text-slate-400 text-sm italic py-4">No Kunyomi readings found.</p>
                                                    )}
                                                </div>
                                            </DetailCard>
                                        </>
                                    ) : (
                                        <DetailCard title="Primary Reading" icon={Volume2} className="md:col-span-2">
                                            <div className="flex items-center gap-6 p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                                <span className="text-5xl font-black text-slate-900 font-japanese tracking-widest">{data.primary_reading}</span>
                                                <button className="w-16 h-16 rounded-full bg-white shadow-xl shadow-slate-200 flex items-center justify-center text-rose-500 hover:scale-110 active:scale-95 transition-all">
                                                    <Volume2 size={32} />
                                                </button>
                                            </div>
                                        </DetailCard>
                                    )}
                                </div>
                                {data.reading_story && (
                                    <DetailCard title="Reading Mnemonic" icon={Lightbulb} color="rose">
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-lg text-slate-600 leading-loose font-medium whitespace-pre-wrap">
                                                {data.reading_story}
                                            </p>
                                        </div>
                                    </DetailCard>
                                )}
                            </div>
                        )}

                        {activeSection === 'practice' && (
                            <div className="space-y-8">
                                {data.examples?.map((ex, i) => (
                                    <div key={i} className="group p-10 rounded-[48px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 hover:border-rose-200 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-rose-50 transition-colors"></div>

                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-rose-500 transition-all shadow-inner">
                                                <Volume2 size={24} />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">EX-0{i + 1}</span>
                                                <div className="w-8 h-px bg-slate-100 group-hover:w-16 group-hover:bg-rose-200 transition-all"></div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            <p className="text-3xl md:text-4xl font-black text-slate-900 font-japanese leading-relaxed">
                                                {ex.jp || ex.japanese}
                                            </p>
                                            <div className="h-1 w-16 bg-rose-100 rounded-full group-hover:w-full group-hover:bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700"></div>
                                            <p className="text-xl text-slate-500 font-bold leading-relaxed tracking-tight group-hover:text-slate-800 transition-colors">
                                                {ex.en || ex.english}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SRS Progress & Progression Footer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-t border-slate-100 pt-16">
                <div className="md:col-span-12 lg:col-span-8">
                    <div className="p-12 rounded-[56px] bg-slate-900 text-white shadow-3xl shadow-slate-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-40 -mb-40 blur-3xl"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className={cn("w-32 h-32 rounded-[40px] bg-gradient-to-br flex items-center justify-center shadow-2xl shrink-0 scale-100 group-hover:scale-105 transition-transform duration-500", stageColors)}>
                                <ProgressIcon size={48} className="drop-shadow-lg" />
                            </div>

                            <div className="space-y-6 flex-1 text-center md:text-left">
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">LEARNING PROGRESSION</div>
                                    <h4 className="text-5xl font-black tracking-tighter uppercase">{data.state}</h4>
                                </div>

                                <div className="space-y-3">
                                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div className={cn("h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.3)]", stageColors)} style={{ width: data.state === 'burned' ? '100%' : data.state === 'review' ? '75%' : data.state === 'learning' ? '40%' : '10%' }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>NEW ITEM</span>
                                        <span>ENLIGHTENED</span>
                                        <span>BURNED</span>
                                    </div>
                                </div>

                                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                                    {data.state === 'new'
                                        ? "This item is waiting for your attention. Adding it to a deck will initiate the Spaced Repetition System (SRS) protocol."
                                        : `Impressive progress! You've reached the ${data.state} milestone. Keep your review streaks alive to achieve total mastery.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                    <div className="p-10 rounded-[48px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">External Resources</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <ResourceButton label="Jisho Japanese Dictionary" icon={ExternalLink} />
                                <ResourceButton label="WaniKani Item Information" icon={ExternalLink} />
                                <ResourceButton label="Bunpro Grammar Path" icon={ExternalLink} />
                                <ResourceButton label="YouGlish Japanese Context" icon={Volume2} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Specialized Content Components ---

function RadicalContent({ data }: { data: KUDetail }) {
    return (
        <DetailCard title="Primary Meaning" icon={Info} color="rose">
            <div className="p-10 rounded-[32px] bg-rose-50/50 border border-rose-100 shadow-sm transition-all hover:bg-rose-50">
                <p className="text-6xl font-black text-rose-900 drop-shadow-sm uppercase tracking-tighter">
                    {data.meaning}
                </p>
            </div>
        </DetailCard>
    );
}

function KanjiContent({ data }: { data: KUDetail }) {
    const meanings = data.meaning_data?.meanings || [data.meaning];
    return (
        <div className="space-y-8">
            <DetailCard title="Meanings & Synonyms" icon={Info} color="rose">
                <div className="flex flex-wrap gap-4">
                    {meanings.map((m: string, i: number) => (
                        <div key={i} className="px-8 py-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-900 font-black text-xl uppercase tracking-tight shadow-sm">
                            {m}
                        </div>
                    ))}
                </div>
            </DetailCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[40px] bg-indigo-50/50 border border-indigo-100 space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">ONYOMI</span>
                    <div className="text-3xl font-black text-indigo-900 font-japanese">
                        {data.onyomi?.join('、') || 'None'}
                    </div>
                </div>
                <div className="p-8 rounded-[40px] bg-amber-50/50 border border-amber-100 space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">KUNYOMI</span>
                    <div className="text-3xl font-black text-amber-900 font-japanese">
                        {data.kunyomi?.join('、') || 'None'}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VocabularyContent({ data }: { data: KUDetail }) {
    return (
        <div className="space-y-8">
            <DetailCard title="Core Meaning" icon={Info} color="rose">
                <div className="p-10 rounded-[32px] bg-blue-50/50 border border-blue-100 shadow-sm">
                    <p className="text-5xl font-black text-blue-900 drop-shadow-sm uppercase tracking-tighter">
                        {data.meaning}
                    </p>
                </div>
            </DetailCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PART OF SPEECH</span>
                    <span className="text-sm font-bold text-slate-700">Vocabulary Item</span>
                </div>
                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">JLPT</span>
                    <span className="text-sm font-extrabold text-blue-600">Level {data.level}</span>
                </div>
                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PITCH</span>
                    <span className="text-sm font-bold text-slate-400 italic">Not available</span>
                </div>
            </div>
        </div>
    );
}

function GrammarContent({ data }: { data: KUDetail }) {
    return (
        <div className="space-y-8">
            <DetailCard title="Structure & Usage" icon={Book} color="rose">
                <div className="p-10 rounded-[32px] bg-slate-900 text-white shadow-2xl space-y-6">
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">GRAMMAR PATTERN</span>
                        <p className="text-4xl font-black font-japanese leading-relaxed">
                            {data.character || data.slug.split('/').pop()}
                        </p>
                    </div>
                    <div className="h-px bg-white/10 w-full" />
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">TYPICAL STRUCTURE</span>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <code className="text-rose-400 font-bold text-xl font-japanese">
                                {typeof data.structure_json === 'string' ? data.structure_json : JSON.stringify(data.structure_json || "Standard Usage")}
                            </code>
                        </div>
                    </div>
                </div>
            </DetailCard>
        </div>
    );
}

// --- Helper UI Components ---

function ActionButton({ icon: Icon }: { icon: any }) {
    return (
        <button className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95">
            <Icon size={20} />
        </button>
    );
}

function TabItem({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-8 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all duration-300",
                active
                    ? "bg-white text-slate-900 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] scale-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/40"
            )}
        >
            {label}
        </button>
    );
}

function DetailCard({ title, icon: Icon, children, color = "slate", className }: { title: string, icon: any, children: React.ReactNode, color?: string, className?: string }) {
    return (
        <div className={cn("p-10 rounded-[56px] bg-white border border-slate-100 shadow-xl shadow-slate-200/30 space-y-10", className)}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner",
                    color === "rose" ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
                )}>
                    <Icon size={18} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

function ReadingItem({ reading }: { reading: string }) {
    return (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 hover:bg-rose-50/30 transition-all">
            <span className="text-3xl font-black text-slate-800 font-japanese group-hover:text-rose-600 transition-colors">{reading}</span>
            <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-rose-500 group-hover:bg-white transition-all shadow-sm">
                <Volume2 size={18} />
            </button>
        </div>
    );
}

function ResourceButton({ label, icon: Icon }: { label: string, icon: any }) {
    return (
        <Button variant="outline" className="h-16 rounded-[22px] border-slate-100 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all font-black text-[10px] tracking-widest uppercase group px-6">
            <span className="flex-1 text-left">{label}</span>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                <Icon size={14} />
            </div>
        </Button>
    );
}

function LoadingSkeleton() {
    return (
        <div className="max-w-7xl mx-auto p-20 space-y-12 bg-white min-h-screen">
            <div className="flex gap-4 mb-12">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse"></div>
                <div className="w-32 h-6 bg-slate-100 rounded animate-pulse mt-3"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 aspect-square bg-slate-50 animate-pulse rounded-[64px]"></div>
                <div className="lg:col-span-8 space-y-8">
                    <div className="w-2/3 h-24 bg-slate-50 animate-pulse rounded-[32px]"></div>
                    <div className="w-full h-80 bg-slate-50 animate-pulse rounded-[48px]"></div>
                </div>
            </div>
        </div>
    );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
    return (
        <div className="max-w-7xl mx-auto p-32 flex flex-col items-center justify-center text-center space-y-12">
            <div className="relative">
                <div className="w-40 h-40 rounded-full bg-rose-50 flex items-center justify-center text-rose-200">
                    <BookOpen size={80} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-rose-500">
                    <Info size={32} />
                </div>
            </div>
            <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">CONTENT NOT FOUND</h2>
                <p className="text-slate-400 max-w-md mx-auto font-medium text-lg leading-relaxed">The wisdom you seek is not currently in our library. It may have been relocated or exists in a different form.</p>
            </div>
            <Button onClick={onBack} className="rounded-full px-12 h-16 bg-slate-900 font-black text-xs tracking-widest uppercase hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all hover:translate-y-[-4px]">
                RETURN TO LIBRARY
            </Button>
        </div>
    );
}
