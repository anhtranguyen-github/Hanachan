'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/components/ui/dialog";
import { Button } from '@/ui/components/ui/button';
import { Input } from '@/ui/components/ui/input';
import { Loader2, Zap, BookOpen, AlertCircle } from 'lucide-react';
import { mineSentenceAction, MineSentenceParams } from '../actions';

interface MiningModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: Partial<MineSentenceParams>;
    mode: 'word' | 'sentence';
}

export function MiningModal({ isOpen, onClose, initialData, mode }: MiningModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        textJa: initialData.textJa || '',
        textEn: initialData.textEn || '',
        targetWord: initialData.targetWord || '',
        targetMeaning: initialData.targetMeaning || '',
        sourceType: initialData.sourceType || 'manual',
        sourceId: initialData.sourceId || '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                textJa: initialData.textJa || '',
                textEn: initialData.textEn || '',
                targetWord: initialData.targetWord || '',
                targetMeaning: initialData.targetMeaning || '',
                sourceType: initialData.sourceType || 'manual',
                sourceId: initialData.sourceId || '',
            });
        }
    }, [isOpen, initialData]);

    const handleMine = async () => {
        setLoading(true);
        try {
            const res = await mineSentenceAction(formData as MineSentenceParams);
            if (res.success) {
                onClose();
            } else {
                alert("Mining failed: " + res.error);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-slate-50/50 p-6 border-b border-slate-100">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl shadow-sm ${mode === 'word' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                {mode === 'word' ? <BookOpen size={22} /> : <Zap size={22} />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900">
                                    {mode === 'word' ? 'Mine Word' : 'Mine Sentence'}
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Source: {formData.sourceType}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Context Sentence</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[15px] font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none resize-none min-h-[100px] font-jp leading-relaxed"
                            value={formData.textJa}
                            onChange={(e) => setFormData({ ...formData, textJa: e.target.value })}
                            placeholder="Enter the Japanese sentence..."
                        />
                    </div>

                    {mode === 'word' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Word</label>
                                <Input
                                    className="bg-slate-50 border-slate-100 rounded-xl h-12 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100"
                                    value={formData.targetWord}
                                    onChange={(e) => setFormData({ ...formData, targetWord: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Definition</label>
                                <Input
                                    className="bg-slate-50 border-slate-100 rounded-xl h-12 font-bold text-slate-800 focus:ring-2 focus:ring-blue-100"
                                    value={formData.targetMeaning}
                                    onChange={(e) => setFormData({ ...formData, targetMeaning: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">English Translation</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[15px] font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none min-h-[80px]"
                            value={formData.textEn}
                            onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                            placeholder="Optional translation..."
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        className={`flex-[2] rounded-xl h-14 font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 ${mode === 'word' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                        onClick={handleMine}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : mode === 'word' ? 'Create Word Card' : 'Save To Collection'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
