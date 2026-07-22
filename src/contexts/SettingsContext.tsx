"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserSettings, NavItem } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

const SETTINGS_KEY = "tophexity_settings";

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  updateNavItems: (items: NavItem[]) => void;
  toggleNavItem: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateNavItems = useCallback((items: NavItem[]) => {
    setSettings((prev) => {
      const next = { ...prev, navItems: items };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleNavItem = useCallback((id: string) => {
    setSettings((prev) => {
      const navItems = prev.navItems.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      );
      const next = { ...prev, navItems };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateNavItems, toggleNavItem }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
