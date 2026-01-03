
import React from 'react';

export function GrammarPanel({ matches }: { matches?: any[] }) {
    return (
        <div className="p-4 bg-slate-50 rounded">
            <h3 className="font-bold text-sm mb-2">Grammar (Mock)</h3>
            <p className="text-xs text-slate-500">Grammar analysis disabled in UI-only mode.</p>
        </div>
    );
}
