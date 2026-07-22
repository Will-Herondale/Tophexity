"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import NavCustomizer from "./NavCustomizer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, Bell, Palette } from "lucide-react";

export default function SettingsForm() {
  const { settings, updateSettings } = useSettings();
  const [theme, setTheme] = useState(settings.theme);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ theme, notifications });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-[#5a5a6a]" />
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0]">Appearance</h3>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#8a8a9a]">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            className="w-full rounded-lg border border-[rgba(30,79,163,0.15)] bg-[#0d214f]/30 px-3 py-2 text-sm text-[#f0f0f0] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-[#5a5a6a]" />
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0]">Notifications</h3>
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
                className="h-4 w-4 rounded border-[rgba(30,79,163,0.3)] bg-[#0d214f] text-[#1E4FA3] focus:ring-[#1E4FA3] focus:ring-offset-[#0a0a0f]"
              />
              <span className="text-sm text-[#f0f0f0]">{item.label}</span>
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
