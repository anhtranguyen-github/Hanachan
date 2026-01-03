
"use client";

import React from "react";
import { ReactNode } from "react";
// Import mocks locally if needed, or just standard children wrapper
import { AuthProvider } from "@/features/auth/AuthContext";
import { AnalysisProvider } from "@/features/analysis/hooks/AnalysisContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <AnalysisProvider>
        {children}
      </AnalysisProvider>
    </AuthProvider>
  );
}
