"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import SettingsForm from "@/components/settings/SettingsForm";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  usePageTitle("Settings");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">Settings</h1>
            <p className="text-sm text-text-secondary">Customize your experience</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SettingsForm />
      </motion.div>
    </div>
  );
}
