"use client";

import React from "react";
import { ReactNode } from "react";
import { AuthProvider } from "@/modules/auth/AuthContext";
import { AnalysisProvider } from "@/modules/analysis/hooks/AnalysisContext";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <AnalysisProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </AnalysisProvider>
    </AuthProvider>
  );
}
