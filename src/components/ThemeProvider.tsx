"use client";

import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (settings.theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  return <>{children}</>;
}
