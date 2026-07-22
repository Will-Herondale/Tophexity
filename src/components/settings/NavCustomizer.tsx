"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { GripVertical, Eye, EyeOff } from "lucide-react";

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
    <div>
      <h3 className="mb-3 text-sm font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0]">Navigation Items</h3>
      <p className="mb-4 text-xs text-[#8a8a9a]">Toggle visibility and reorder sidebar items.</p>
      <div className="space-y-2">
        {sorted.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-[rgba(30,79,163,0.15)] bg-[#0d214f]/30 px-3 py-2.5"
          >
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="text-[#5a5a6a] hover:text-[#8a8a9a] disabled:opacity-30"
            >
              <GripVertical className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === sorted.length - 1}
              className="text-[#5a5a6a] hover:text-[#8a8a9a] disabled:opacity-30"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex-1 text-sm text-[#f0f0f0]">{item.label}</span>
            <button
              onClick={() => toggleNavItem(item.id)}
              className={`rounded p-1 ${item.visible ? "text-emerald-400 hover:bg-emerald-500/10" : "text-[#5a5a6a] hover:bg-[#0d214f]/60"}`}
            >
              {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
