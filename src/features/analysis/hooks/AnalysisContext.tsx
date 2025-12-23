
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalysisContextType {
    selectedWord: any | null;
    setSelectedWord: (word: any | null) => void;
    analysisResult: any | null;
    setAnalysisResult: (result: any | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [selectedWord, setSelectedWord] = useState<any | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);

    return (
        <AnalysisContext.Provider value={{ selectedWord, setSelectedWord, analysisResult, setAnalysisResult }}>
            {children}
        </AnalysisContext.Provider>
    );
}

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        // Return a dummy context to prevent crashes if used outside provider
        return {
            selectedWord: null,
            setSelectedWord: () => { },
            analysisResult: null,
            setAnalysisResult: () => { }
        };
    }
    return context;
};
