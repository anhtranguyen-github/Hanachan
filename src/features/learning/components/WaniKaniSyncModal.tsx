'use client';

import React, { useState } from 'react';
import { BaseModal } from '@/components/shared/BaseModal';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  Key, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { syncWaniKaniDataAction } from '../actions';
import { clsx } from 'clsx';

interface WaniKaniSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaniKaniSyncModal({ isOpen, onClose }: WaniKaniSyncModalProps) {
  const [apiToken, setApiToken] = useState('');
  const [strategy, setStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ total: number; updated: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!apiToken) {
      setError('Please enter your WaniKani API token.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await syncWaniKaniDataAction(apiToken, strategy);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Failed to sync data.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="WaniKani Progress Sync"
      subtitle="Import your progression data from WaniKani"
      maxWidth="lg"
      footer={
        result ? (
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#3E4A61] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2D3748] transition-all"
          >
            Done
          </button>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#F7FAFC] border border-border rounded-2xl text-xs font-black uppercase tracking-widest text-foreground/50 hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSync}
              disabled={loading || !apiToken}
              className="flex-1 py-3 bg-[#3E4A61] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2D3748] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#3E4A61]/20"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database size={14} />
                  Start Sync
                </>
              )}
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {result ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#3E4A61]">Sync Completed!</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-[300px] mx-auto">
                <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/50">
                  <p className="text-[10px] font-black text-foreground/40 uppercase">Updated</p>
                  <p className="text-lg font-black text-green-500">{result.updated}</p>
                </div>
                <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/50">
                  <p className="text-[10px] font-black text-foreground/40 uppercase">Skipped</p>
                  <p className="text-lg font-black text-[#3E4A61] opacity-50">{result.skipped}</p>
                </div>
              </div>
              <p className="text-xs text-foreground/50 font-medium mt-4 max-w-[320px]">
                Processed {result.total} items. Local progress was preserved wherever it was ahead of WaniKani.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* API Token Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Key size={10} /> Personal Access Token (v2)
                </label>
                <a 
                  href="https://www.wanikani.com/settings/personal_access_tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  Get Token <ExternalLink size={8} />
                </a>
              </div>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Paste your API token here..."
                className="w-full px-4 py-3 bg-[#F7FAFC] border border-border rounded-2xl text-sm font-bold text-[#3E4A61] outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
              />
              <p className="text-[9px] text-foreground/30 font-medium leading-relaxed">
                Hanachan uses this token only to fetch your assignments. It is not stored on our servers permanently.
              </p>
            </div>

            {/* Sync Strategy Section */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                <Info size={10} /> Conflict Resolution Strategy
              </label>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setStrategy('merge')}
                  className={clsx(
                    "flex items-start gap-3 p-4 border rounded-2xl transition-all text-left",
                    strategy === 'merge' 
                      ? "bg-primary/5 border-primary ring-1 ring-primary"
                      : "bg-white border-border hover:bg-surface-muted"
                  )}
                >
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    strategy === 'merge' ? "border-primary bg-primary" : "border-border"
                  )}>
                    {strategy === 'merge' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#3E4A61] uppercase tracking-tight">Merge (Safe)</p>
                    <p className="text-[10px] text-foreground/50 font-medium mt-0.5">
                      Only update if WaniKani is strictly ahead. Best for daily syncing.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setStrategy('overwrite')}
                  className={clsx(
                    "flex items-start gap-3 p-4 border rounded-2xl transition-all text-left",
                    strategy === 'overwrite' 
                      ? "bg-amber-50 border-amber-200 ring-1 ring-amber-200"
                      : "bg-white border-border hover:bg-surface-muted"
                  )}
                >
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    strategy === 'overwrite' ? "border-amber-500 bg-amber-500" : "border-border"
                  )}>
                    {strategy === 'overwrite' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-amber-600 uppercase tracking-tight">Full Sync</p>
                      <RefreshCw size={10} className="text-amber-500" />
                    </div>
                    <p className="text-[10px] text-foreground/50 font-medium mt-0.5">
                      Update all items to match WaniKani levels, but still preserve any local items that are further ahead.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-red-500">{error}</span>
              </div>
            )}
            
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
              <Lock size={12} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-700 font-bold leading-relaxed">
                This process only affects your Global WaniKani progress. Your Custom Decks and Hanachan-specific units remain untouched.
              </p>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
