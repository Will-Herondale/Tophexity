"use client";

import { clsx } from "clsx";

interface Tab {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: number;
  onTabChange: (id: number) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={clsx("border-b border-border", className)}>
      <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:border-border-light hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
