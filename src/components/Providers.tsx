"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useAuthInit } from "@/hooks/useAuthInit";
import ThemeProvider from "@/components/ThemeProvider";

function AuthInit() {
  useAuthInit();
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthInit />
      <SettingsProvider>
        <ThemeProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
