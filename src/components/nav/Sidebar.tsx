"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import SidebarItem from "./SidebarItem";
import { LogOut, ChevronLeft, ChevronRight, Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = settings.navItems
    .filter((item) => item.visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const current = themes.indexOf(settings.theme);
    const next = themes[(current + 1) % themes.length];
    updateSettings({ theme: next });
  };

  const ThemeIcon = settings.theme === "light" ? Sun : settings.theme === "dark" ? Moon : Monitor;

  return (
    <aside
      className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`flex items-center border-b border-gray-200 p-4 dark:border-gray-700 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Tophexity</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => (
          <SidebarItem key={item.id} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <button
          onClick={cycleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-700 ${
            collapsed ? "justify-center" : ""
          }`}
          title={`Theme: ${settings.theme}`}
        >
          <ThemeIcon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="capitalize">{settings.theme}</span>}
        </button>

        {!collapsed && user && (
          <p className="my-2 truncate px-3 text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
        )}
        <button
          onClick={() => logout()}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
