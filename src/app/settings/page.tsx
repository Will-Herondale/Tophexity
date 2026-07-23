"use client";

import SettingsForm from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Customize your experience</p>
      </div>
      <SettingsForm />
    </div>
  );
}
