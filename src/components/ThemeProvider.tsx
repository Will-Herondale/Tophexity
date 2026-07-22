"use client";

import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("dark");
  }, [settings.theme]);

  return <>{children}</>;
}
