'use client';

import React, { createContext, useContext } from 'react';

const QuotaContext = createContext<any>(null);

export function QuotaProvider({ children }: { children: React.ReactNode }) {
    return <QuotaContext.Provider value={{ usage: {} }}>{children}</QuotaContext.Provider>;
}

export function useQuotaContext() {
    return useContext(QuotaContext);
}
