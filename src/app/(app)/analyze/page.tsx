
'use client';

import React, { useState } from 'react';
import { Button } from '@/ui/components/ui/button';
import { PageHeader } from '@/ui/components/PageHeader';
import { Sparkles, ScanText, Save, Bot } from 'lucide-react';

export default function AnalyzePage() {
    const [sentence, setSentence] = useState('私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。');
    const [isAnalyzed, setIsAnalyzed] = useState(true);
    const [activeTab, setActiveTab] = useState<'word' | 'politeness' | 'grammar'>('word');
    const [showAiExplainer, setShowAiExplainer] = useState(false);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            <PageHeader
                title="Sentence Analyzer"
                subtitle="Deconstruct Japanese sentences into understandable parts"
                icon={ScanText}
                iconColor="text-blue-600"
            />

            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Sentence</label>
                    <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-lg font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px] resize-none"
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value)}
                    />
                    <div className="text-right mt-1 text-xs text-slate-400">{sentence.length}/100 characters</div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button className="bg-purple-500 hover:bg-purple-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-purple-200" onClick={() => setShowAiExplainer(true)}>
                        <Bot size={18} className="mr-2" /> Explain with AI
                    </Button>
                    <Button className="btn-primary h-12 px-8 rounded-xl shadow-lg shadow-blue-200" onClick={() => setIsAnalyzed(true)}>
                        Analyze Sentence
                    </Button>
                </div>
            </div>

            {/* AI Explainer Box (Conditional) */}
            {showAiExplainer && (
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                            <Sparkles size={20} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-800">AI Explanation</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                This sentence expresses a personal preference. Specifically:
                                <br />
                                • <span className="font-bold text-purple-600">私は (Watashi wa)</span> marks the speaker as the topic.
                                <br />
                                • <span className="font-bold text-purple-600">雨の日曜日の午後に (Ame no nichiyōbi no gogo ni)</span> sets the specific time: "on rainy Sunday afternoons". The particle <span className="font-bold">に (ni)</span> marks the time.
                                <br />
                                • <span className="font-bold text-purple-600">聴くのが好きです (kiku no ga suki desu)</span> means "like listening to...". The <span className="font-bold">の (no)</span> nominalizes the verb "listen" into "listening".
                                <br /><br />
                                Overall nuance: It feels somewhat poetic or atmospheric, specifying exact conditions for enjoying the music.
                            </p>
                            <Button variant="ghost" size="sm" className="text-purple-500 hover:bg-purple-50 text-xs mt-2" onClick={() => setShowAiExplainer(false)}>Close Explanation</Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Analysis Results Tabs */}
            {isAnalyzed && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <div className="flex border-b border-slate-100 px-6">
                        <TabButton label="Word Analysis" active={activeTab === 'word'} onClick={() => setActiveTab('word')} />
                        <TabButton label="Politeness Variants" active={activeTab === 'politeness'} onClick={() => setActiveTab('politeness')} />
                        <TabButton label="Grammar Points" active={activeTab === 'grammar'} onClick={() => setActiveTab('grammar')} />
                    </div>

                    <div className="p-8">
                        {activeTab === 'word' && (
                            <div className="space-y-8 animate-in fade-in">
                                {/* Tokenizer Visual */}
                                <div className="flex flex-wrap gap-2 justify-center mb-8">
                                    {[
                                        { t: '私', c: 'blue' }, { t: 'は', c: 'green' },
                                        { t: '雨', c: 'purple' }, { t: 'の', c: 'green' },
                                        { t: '日曜日', c: 'blue' }, { t: 'の', c: 'green' },
                                        { t: '午後', c: 'blue' }, { t: 'に', c: 'green' },
                                        { t: 'ドゥームメタル', c: 'blue' }, { t: 'を', c: 'green' },
                                        { t: '聴く', c: 'blue' }, { t: 'の', c: 'green' }, { t: 'が', c: 'green' },
                                        { t: '好き', c: 'rose' }, { t: 'です', c: 'orange' }
                                    ].map((item, i) => (
                                        <span key={i} className={`px-3 py-2 rounded-lg border text-lg font-medium cursor-pointer ${item.c === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                                            item.c === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                                                item.c === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' :
                                                    item.c === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' :
                                                        'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100'
                                            }`}>
                                            {item.t}
                                        </span>
                                    ))}
                                </div>

                                <div className="text-center space-y-2 text-slate-500">
                                    <p className="text-sm">Watashi wa ame no nichiyōbi no gogo ni dūmu metaru o kiku no ga suki desu.</p>
                                    <p className="text-lg font-medium text-slate-800 italic">I like listening to doom metal on rainy Sunday afternoons.</p>
                                </div>

                                {/* Detail Box (Hardcoded for Sunday example) */}
                                <div className="mt-12 pt-8 border-t border-slate-100">
                                    <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                                        日曜日 <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded uppercase">noun</span>
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reading</div>
                                            <div className="text-xl font-bold text-slate-800">にちようび</div>
                                            <div className="text-xs text-slate-400">nichiyōbi</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Translation</div>
                                            <div className="text-xl font-bold text-slate-800">Sunday</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Part of Speech</div>
                                            <div className="text-xl font-bold text-slate-800">名詞 (noun)</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Form</div>
                                            <div className="text-xl font-bold text-slate-800">日曜日</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'politeness' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="font-bold text-slate-800 text-lg mb-4">Politeness Variants</h3>

                                <PolitenessCard
                                    title="Casual"
                                    japanese="私は雨の日曜日の午後にドゥームメタルを聴くのが好きだ。"
                                    romaji="...suki da."
                                    desc="Used among friends, family, and casual settings."
                                    tag="くだけた"
                                />
                                <PolitenessCard
                                    title="Polite (Current)"
                                    japanese="私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。"
                                    romaji="...suki desu."
                                    desc="Standard polite form for most situations."
                                    tag="丁寧語"
                                    active
                                />
                                <PolitenessCard
                                    title="Honorific"
                                    japanese="私は雨の日曜日の午後にドゥームメタルを拝聴するのが好きでございます。"
                                    romaji="...haichō suru no ga suki de gozaimasu."
                                    desc="Formal speech used in business or toward superiors."
                                    tag="敬語"
                                />
                            </div>
                        )}

                        {activeTab === 'grammar' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="font-bold text-slate-800 text-lg mb-4">Grammar Points</h3>

                                <GrammarPointCard
                                    title="のが好きです"
                                    desc="This pattern is used to express liking an action or activity."
                                    structure="Verb (dictionary form) + のが好きです"
                                    example={{ jp: '映画を見るのが好きです', en: 'I like watching movies' }}
                                />
                                <GrammarPointCard
                                    title="XのY (Possessive/Descriptive)"
                                    desc="The particle の connects nouns to show possession or attribution."
                                    structure="Noun X + の + Noun Y"
                                    example={{ jp: '雨の日曜日', en: 'Rainy Sunday (Sunday of rain)' }}
                                />
                                <GrammarPointCard
                                    title="を (Object Marker)"
                                    desc="The particle を marks the direct object of a verb action."
                                    structure="Direct Object + を + Verb"
                                    example={{ jp: 'ドゥームメタルを聴く', en: 'listen to doom metal' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save Button */}
            {isAnalyzed && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-slate-600 flex items-center gap-2"><Save size={18} /> Save Sentence</span>
                </div>
            )}

            <div className="pt-8 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center justify-between">
                    My Saved Sentences
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><span className="rotate-90">›</span></Button>
                </h3>
            </div>
        </div>
    );
}

function TabButton({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${active ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
            {label}
        </button>
    )
}

function PolitenessCard({ title, japanese, romaji, desc, tag, active }: any) {
    return (
        <div className={`p-6 rounded-xl border ${active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className={`font-bold ${active ? 'text-blue-700' : 'text-slate-800'}`}>{title}</h4>
                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">{tag}</span>
            </div>
            <p className="text-lg font-medium text-slate-800 mb-1">{japanese}</p>
            <p className={`text-xs ${active ? 'text-blue-600' : 'text-slate-400'} font-medium mb-3`}>{romaji}</p>
            <p className="text-xs text-slate-500 italic">{desc}</p>
        </div>
    )
}

function GrammarPointCard({ title, desc, structure, example }: any) {
    return (
        <div className="p-6 rounded-xl border border-l-4 border-slate-200 border-l-blue-500 bg-slate-50/50">
            <h4 className="font-bold text-blue-700 mb-1">{title}</h4>
            <p className="text-sm text-slate-600 mb-4">{desc}</p>

            <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                <div>
                    <span className="text-xs font-bold text-slate-800 block">Structure:</span>
                    <span className="text-xs text-slate-600">{structure}</span>
                </div>
                <div>
                    <span className="text-xs font-bold text-slate-800 block">Example:</span>
                    <span className="text-sm text-blue-600 font-medium">{example.jp}</span>
                    <div className="text-xs text-slate-500 italic">({example.en})</div>
                </div>
            </div>
        </div>
    )
}
