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
      className={`flex h-screen flex-col border-r border-[#1E4FA3]/10 bg-[#0d214f]/50 transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className={`flex items-center border-b border-[#1E4FA3]/10 p-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[#1E4FA3]">
            Tophexity
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-[#8a8a9a] hover:bg-[#1E4FA3]/10 hover:text-[#f0f0f0]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => (
          <SidebarItem key={item.id} href={item.href} label={item.label} icon={item.icon} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-[#1E4FA3]/10 p-3">
        <button
          onClick={cycleTheme}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8a8a9a] hover:bg-[#1E4FA3]/5 hover:text-[#f0f0f0] transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title={`Theme: ${settings.theme}`}
        >
          <ThemeIcon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="capitalize">{settings.theme}</span>}
        </button>

        {!collapsed && user && (
          <p className="my-2 truncate px-3 text-xs text-[#8a8a9a]">{user.email}</p>
        )}
        <button
          onClick={() => logout()}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8a8a9a] hover:bg-red-900/20 hover:text-red-400 transition-colors ${
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