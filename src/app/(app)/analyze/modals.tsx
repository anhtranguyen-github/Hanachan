
'use client';

import React from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Button } from '@/ui/components/ui/button';

interface TokenDetailModalProps {
    token: { surface: string; reading?: string; meaning: string; type?: string } | null;
    onClose: () => void;
    onAddToDeck: () => void;
}

export function TokenDetailModal({ token, onClose, onAddToDeck }: TokenDetailModalProps) {
    if (!token) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{token.type || 'Vocabulary'}</div>
                    <h2 className="text-4xl font-black text-slate-800 mb-2">{token.surface}</h2>
                    <p className="text-lg text-slate-500 font-medium">{token.reading}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Meaning</h3>
                    <p className="text-slate-800 font-bold text-lg">{token.meaning}</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 font-bold border-slate-200" onClick={onClose}>Close</Button>
                    <Button className="flex-1 bg-rose-400 hover:bg-rose-500 font-bold text-white shadow-md shadow-rose-100" onClick={onAddToDeck}>
                        <Plus size={16} className="mr-2" /> Add to Deck
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface AddToDeckModalProps {
    isOpen: boolean;
    token: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function AddToDeckModal({ isOpen, token, onClose, onConfirm }: AddToDeckModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Add "{token}" to Deck</h3>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Select Deck</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-200">
                            <option>Core 2k/6k</option>
                            <option>Mining Deck</option>
                            <option>YouTube Vocab</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" className="font-bold text-slate-500" onClick={onClose}>Cancel</Button>
                    <Button className="bg-blue-500 hover:bg-blue-600 font-bold text-white shadow-md shadow-blue-200" onClick={onConfirm}>
                        <Check size={16} className="mr-2" /> Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
}
