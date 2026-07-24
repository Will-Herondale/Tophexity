"use client";

import { useSettings } from "@/contexts/SettingsContext";
import {
  GripVertical,
  Eye,
  EyeOff,
  LayoutDashboard,
  User,
  Briefcase,
  FolderOpen,
  Star,
  Map,
  Shield,
  MessageSquare,
  Settings,
} from "lucide-react";

const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  User,
  Briefcase,
  FolderOpen,
  Star,
  Map,
  Shield,
  MessageSquare,
  Settings,
};

export default function NavCustomizer() {
  const { settings, updateNavItems, toggleNavItem } = useSettings();

  const sorted = [...settings.navItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const items = [...sorted];
    const temp = items[index].order;
    items[index].order = items[index - 1].order;
    items[index - 1].order = temp;
    updateNavItems(items);
  };

  const moveDown = (index: number) => {
    if (index === sorted.length - 1) return;
    const items = [...sorted];
    const temp = items[index].order;
    items[index].order = items[index + 1].order;
    items[index + 1].order = temp;
    updateNavItems(items);
  };

  return (
    <div className="pt-4">
      <div className="space-y-1.5">
        {sorted.map((item, index) => {
          const Icon = iconMap[item.icon];
          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                item.visible
                  ? "bg-surface/15 hover:bg-surface/25"
                  : "bg-surface/5 opacity-50"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-text-muted hover:text-foreground disabled:opacity-20 transition-colors p-0.5"
                >
                  <GripVertical className="h-3 w-3 -rotate-90" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === sorted.length - 1}
                  className="text-text-muted hover:text-foreground disabled:opacity-20 transition-colors p-0.5"
                >
                  <GripVertical className="h-3 w-3 rotate-90" />
                </button>
              </div>
              <div className="w-7 h-7 rounded-lg bg-surface/30 flex items-center justify-center flex-shrink-0">
                {Icon && <Icon className="h-3.5 w-3.5 text-text-secondary" />}
              </div>
              <span className="flex-1 text-sm text-foreground">{item.label}</span>
              <button
                onClick={() => toggleNavItem(item.id)}
                className={`rounded-lg p-1.5 transition-colors ${
                  item.visible
                    ? "text-accent hover:bg-accent/10"
                    : "text-text-muted hover:bg-surface/40"
                }`}
              >
                {item.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
