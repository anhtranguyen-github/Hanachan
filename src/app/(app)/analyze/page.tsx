'use client';

import React, { useState } from 'react';
import { Button } from '@/ui/components/ui/button';
import { PageHeader } from '@/ui/components/PageHeader';
import { Sparkles, ScanText, Save, Bot, Loader2 } from 'lucide-react';
import { analyzeSentenceAction } from '@/features/sentence/actions';
import { FullAnalysisResult } from '@/features/sentence/service';
import { AnalyzedUnit } from '@/features/sentence/token-processor';
import { MiningModal } from '@/features/mining/components/MiningModal';


export default function AnalyzePage() {
    const [sentence, setSentence] = useState('私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。');
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<FullAnalysisResult | null>(null);
    const [subTab, setSubTab] = useState<'word' | 'grammar'>('word');
    const [selectedUnit, setSelectedUnit] = useState<AnalyzedUnit | null>(null);

    // Mining Modal State
    const [mineModalOpen, setMineModalOpen] = useState(false);
    const [mineMode, setMineMode] = useState<'word' | 'sentence'>('word');
    const [mineInitialData, setMineInitialData] = useState<any>({});

    const openMineModal = (mode: 'word' | 'sentence', data: any) => {
        setMineMode(mode);
        setMineInitialData(data);
        setMineModalOpen(true);
    };


    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const res = await analyzeSentenceAction(sentence);
            if (res.success && res.data) {
                setAnalysis(res.data);
                setIsAnalyzed(true);
                setSelectedUnit(res.data.units[0] || null);
            } else {
                alert(res.error);
            }
        } catch (e) {
            console.error(e);
            alert("Analysis failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const getColorForPos = (unit: AnalyzedUnit) => {
        if (unit.type === 'particle') return 'green';
        if (unit.pos === '名詞') return 'blue';
        if (unit.pos === '動詞') return 'rose';
        if (unit.pos === '形容詞') return 'purple';
        if (unit.pos === '助動詞') return 'orange';
        return 'slate';
    };

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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px] resize-none font-jp"
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value)}
                    />
                    <div className="text-right mt-1 text-xs text-slate-400">{sentence.length}/100 characters</div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    {analysis && (
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Coverage</span>
                                <span className="text-lg font-black text-blue-600">{analysis.coverage_stats.percentage.toFixed(0)}%</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-100 pl-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Units</span>
                                <span className="text-lg font-black text-slate-700">{analysis.coverage_stats.known_units}/{analysis.coverage_stats.total_units}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                            onClick={async () => {
                                setIsLoading(true);
                                const res = await analyzeSentenceAction(sentence); // Reuse analyze for now or add refine
                                if (res.success) alert("AI Suggestion: " + res.data?.translation);
                                setIsLoading(false);
                            }}
                            disabled={isLoading}
                        >
                            <Sparkles className="w-4 h-4 mr-2" /> Refine
                        </Button>
                        <Button className="btn-primary h-12 px-8 rounded-xl shadow-lg shadow-blue-200" onClick={handleAnalyze} disabled={isLoading}>
                            {isLoading ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : 'Analyze Sentence'}
                        </Button>
                    </div>
                </div>

            </div>

            {/* Analysis Results Tabs */}
            {isAnalyzed && analysis && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <div className="flex border-b border-slate-100 px-6">
                        <TabButton label="Word Analysis" active={subTab === 'word'} onClick={() => setSubTab('word')} />
                        <TabButton label="Grammar & Meaning (AI)" active={subTab === 'grammar'} onClick={() => setSubTab('grammar')} />
                    </div>

                    <div className="p-8">
                        {subTab === 'word' && (
                            <div className="space-y-8 animate-in fade-in">
                                {/* Tokenizer Visual */}
                                <div className="flex flex-wrap gap-2 justify-center mb-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                    {analysis.units.map((item, i) => {
                                        const color = getColorForPos(item);
                                        const isSelected = selectedUnit === item;

                                        return (
                                            <span
                                                key={i}
                                                onClick={() => setSelectedUnit(item)}
                                                className={`px-3 py-2 rounded-xl border text-xl font-bold font-jp cursor-pointer transition-all duration-200
                                                    ${color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                                                        color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                                                            color === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' :
                                                                color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' :
                                                                    color === 'orange' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' :
                                                                        'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}
                                                      ${isSelected ? 'ring-2 ring-offset-2 ring-black transform scale-105 shadow-md' : ''}
                                                      ${item.is_in_ckb ? 'border-b-4 border-b-blue-400' : ''}
                                                `}>
                                                {item.surface}
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* Detail Box */}
                                {selectedUnit ? (
                                    <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-2">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-4xl font-black text-slate-900 flex items-center gap-3 font-jp">
                                                {selectedUnit.surface}
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-sm font-bold rounded-lg uppercase tracking-wider">{selectedUnit.pos}</span>
                                                {selectedUnit.is_in_ckb && <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">In Knowledge Base</span>}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <DetailCard label="Reading" value={selectedUnit.reading || '-'} />
                                            <DetailCard label="Base Form" value={selectedUnit.basic_form} />
                                            <DetailCard label="Type" value={selectedUnit.type} />
                                            <DetailCard label="POS Details" value={`${selectedUnit.pos}`} />
                                        </div>

                                        <div className="mt-6 flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Sparkles size={16} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Mine word with context</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="border-slate-200 text-slate-600 font-bold rounded-xl px-6 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                                                    onClick={() => openMineModal('word', {
                                                        textJa: sentence,
                                                        textEn: analysis?.translation,
                                                        targetWord: selectedUnit.surface,
                                                        targetMeaning: `Base: ${selectedUnit.basic_form}, POS: ${selectedUnit.pos}`,
                                                        sourceType: 'analyze'
                                                    })}
                                                >
                                                    Mine Word
                                                </Button>
                                                <Button
                                                    className="bg-slate-900 text-white font-bold rounded-xl px-6 hover:bg-emerald-600 transition-all"
                                                    onClick={() => openMineModal('sentence', {
                                                        textJa: sentence,
                                                        textEn: analysis?.translation,
                                                        sourceType: 'analyze'
                                                    })}
                                                >
                                                    Mine Full Sentence
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 py-10 font-bold">Select a word above to see details</div>
                                )}
                            </div>
                        )}

                        {subTab === 'grammar' && (
                            <div className="space-y-10 animate-in fade-in">
                                <section>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Bot size={14} /> Translation
                                    </h4>
                                    <p className="text-2xl font-bold text-slate-800 leading-relaxed italic">"{analysis.translation}"</p>
                                </section>

                                <section>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Grammar Discovery</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {analysis.grammar_points.map((gp, i) => (
                                            <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{gp.title}</span>
                                                    <span className="text-lg font-bold text-slate-900 font-jp">{gp.selector}</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 mb-2">{gp.meaning}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed">{gp.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Cloze Suggestion</h4>
                                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center">
                                        <span className="text-xl font-bold text-blue-900 font-jp">{analysis.cloze_suggestion.text}</span>
                                        <Button className="bg-blue-600 text-white font-bold rounded-xl shadow-md">Create Cloze Card</Button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <MiningModal
                isOpen={mineModalOpen}
                onClose={() => setMineModalOpen(false)}
                initialData={mineInitialData}
                mode={mineMode}
            />
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

function DetailCard({ label, value, sub }: any) {
    return (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xl font-bold text-slate-800 font-jp truncate">{value === '*' ? 'None' : value}</div>
            {sub && sub !== '*' && <div className="text-xs text-slate-400 mt-1 font-medium">{sub}</div>}
        </div>
    )
}
