
import React from 'react';
export function DictionaryPanel({ token, onClose }: { token: any, onClose: () => void }) {
    return (
        <div>
            <h3 className="font-bold">{token?.surface || 'Unknown'}</h3>
            <p>Definition mock.</p>
            <button onClick={onClose}>Close</button>
        </div>
    );
}
