"use client";

import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import NavCustomizer from "./NavCustomizer";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Save,
  Sun,
  Moon,
  Monitor,
  Palette,
  Bell,
  User,
  Check,
  LogOut,
  Mail,
  Shield,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-accent" : "bg-surface-light"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function SettingsForm() {
  const { settings, updateSettings } = useSettings();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(settings.notifications);
  const [saved, setSaved] = useState(false);
  const [showNavCustomizer, setShowNavCustomizer] = useState(false);

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    updateSettings({ theme: value });
  };

  const handleSave = () => {
    updateSettings({ notifications });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes: Array<{
    value: "light" | "dark" | "system";
    label: string;
    icon: typeof Sun;
    desc: string;
    preview: { bg: string; surface: string; text: string; accent: string };
  }> = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      desc: "Clean and bright",
      preview: { bg: "#f8f9fc", surface: "#ffffff", text: "#1a1a2e", accent: "#1E4FA3" },
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      desc: "Easy on the eyes",
      preview: { bg: "#0a0a0f", surface: "#0d214f", text: "#f0f0f0", accent: "#1E4FA3" },
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      desc: "Match your device",
      preview: { bg: "linear-gradient(135deg, #f8f9fc 50%, #0a0a0f 50%)", surface: "#0d214f", text: "#f0f0f0", accent: "#1E4FA3" },
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* ─── Appearance ─── */}
      <div className="rounded-2xl bg-surface/20 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Palette className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">Appearance</h3>
            <p className="text-xs text-text-muted">Choose how Tophexity looks on your device</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const active = settings.theme === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={`relative group rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  active
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-border/50 bg-surface/10 hover:border-border hover:bg-surface/20"
                }`}
              >
                {/* Mini preview */}
                <div className="w-full h-16 rounded-lg mb-3 overflow-hidden border border-border/30 relative">
                  <div
                    className="absolute inset-0"
                    style={{ background: t.preview.bg }}
                  />
                  <div
                    className="absolute top-2 left-2 right-2 h-3 rounded-sm"
                    style={{ background: t.preview.surface }}
                  />
                  <div
                    className="absolute bottom-2 left-2 w-8 h-2 rounded-sm"
                    style={{ background: t.preview.accent }}
                  />
                  <div
                    className="absolute bottom-2 left-12 right-2 h-2 rounded-sm"
                    style={{ background: t.preview.surface, opacity: 0.5 }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-text-secondary" />
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                  </div>
                  {active && (
                    <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-1">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Notifications ─── */}
      <div className="rounded-2xl bg-surface/20 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">Notifications</h3>
            <p className="text-xs text-text-muted">Control what you get notified about</p>
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {[
            { key: "email" as const, label: "Email notifications", desc: "Receive updates and alerts via email", icon: Mail },
            { key: "recommendations" as const, label: "New recommendations", desc: "Get notified when new careers match your profile", icon: Shield },
            { key: "roadmapUpdates" as const, label: "Roadmap updates", desc: "Track progress on your career roadmaps", icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface/30 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-text-secondary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block">{item.label}</span>
                    <span className="text-xs text-text-muted">{item.desc}</span>
                  </div>
                </div>
                <Toggle
                  checked={notifications[item.key]}
                  onChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Navigation Customization ─── */}
      <div className="rounded-2xl bg-surface/20 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowNavCustomizer(!showNavCustomizer)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-accent text-sm font-bold">≡</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">Navigation</h3>
              <p className="text-xs text-text-muted">Customize sidebar visibility and order</p>
            </div>
          </div>
          <ChevronRight
            className={`h-4 w-4 text-text-muted transition-transform duration-200 ${
              showNavCustomizer ? "rotate-90" : ""
            }`}
          />
        </button>
        {showNavCustomizer && (
          <div className="px-6 pb-6 border-t border-border/50">
            <NavCustomizer />
          </div>
        )}
      </div>

      {/* ─── Account ─── */}
      {user && (
        <div className="rounded-2xl bg-surface/20 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <User className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">Account</h3>
              <p className="text-xs text-text-muted">Manage your account</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-text-muted mt-0.5">Signed in</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => logout()}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* ─── Save Button ─── */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} className="min-w-[140px]">
          <Save className="mr-1.5 h-4 w-4" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
