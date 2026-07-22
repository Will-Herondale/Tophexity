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
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Navigation Items</h3>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Toggle visibility and reorder sidebar items.</p>
      <div className="space-y-2">
        {sorted.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          >
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-30 dark:text-gray-600 dark:hover:text-gray-300"
            >
              <GripVertical className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === sorted.length - 1}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-30 dark:text-gray-600 dark:hover:text-gray-300"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
            <button
              onClick={() => toggleNavItem(item.id)}
              className={`rounded p-1 ${item.visible ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20" : "text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-700"}`}
            >
              {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
