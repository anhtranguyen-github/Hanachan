"use client";

import React from "react";
import { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ToastProvider } from "@/components/shared/Toast";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
