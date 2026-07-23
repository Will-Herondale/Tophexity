"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import NavCustomizer from "./NavCustomizer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, Bell, Palette } from "lucide-react";

export default function SettingsForm() {
  const { settings, updateSettings } = useSettings();
  const [notifications, setNotifications] = useState(settings.notifications);
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    updateSettings({ theme: value });
  };

  const handleSave = () => {
    updateSettings({ notifications });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">Appearance</h3>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleThemeChange(e.target.value as "light" | "dark" | "system")}
            className="w-full rounded-lg border border-border bg-surface/30 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: "email" as const, label: "Email notifications" },
            { key: "recommendations" as const, label: "New recommendations" },
            { key: "roadmapUpdates" as const, label: "Roadmap updates" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                className="h-4 w-4 rounded border-border-light bg-surface text-accent focus:ring-accent focus:ring-offset-background"
              />
              <span className="text-sm text-foreground">{item.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <NavCustomizer />

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-1 h-4 w-4" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
