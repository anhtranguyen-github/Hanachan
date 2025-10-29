'use client';

import React, { createContext, useContext } from 'react';

const AnalysisContext = createContext<any>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
    return <AnalysisContext.Provider value={{}}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
    return useContext(AnalysisContext);
}
