"use client";

import { useState, useEffect } from "react";
import { getChatStats } from "@/lib/api";
import type { ChatStats } from "@/types/chat";
import { MessageSquare, Hash, Coins, Activity } from "lucide-react";

interface ChatStatsCardProps {
  variant?: "sidebar" | "dashboard";
}

export default function ChatStatsCard({ variant = "dashboard" }: ChatStatsCardProps) {
  const [stats, setStats] = useState<ChatStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    getChatStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  if (variant === "sidebar") {
    return (
      <div className="rounded-lg border border-[rgba(30,79,163,0.1)] bg-[#0a0a0f]/40 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#5a5a6a] uppercase tracking-wider font-medium">Usage</span>
          <Activity className="h-3 w-3 text-[#1E4FA3]" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="text-center">
            <p className="text-sm font-bold font-[family-name:var(--font-display)] text-[#f0f0f0]">{stats.total_sessions}</p>
            <p className="text-[9px] text-[#5a5a6a]">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold font-[family-name:var(--font-display)] text-[#f0f0f0]">{stats.total_messages}</p>
            <p className="text-[9px] text-[#5a5a6a]">Messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(30,79,163,0.12)] bg-[#0d214f]/20 p-5">
      <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0] mb-3 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-teal-400" />
        Chat Usage
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#0a0a0f]/40 border border-[rgba(30,79,163,0.08)] p-3">
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[#f0f0f0]">{stats.total_sessions}</p>
          <p className="text-[10px] text-[#5a5a6a]">Total Sessions</p>
        </div>
        <div className="rounded-xl bg-[#0a0a0f]/40 border border-[rgba(30,79,163,0.08)] p-3">
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[#f0f0f0]">{stats.total_messages}</p>
          <p className="text-[10px] text-[#5a5a6a]">Messages</p>
        </div>
        <div className="rounded-xl bg-[#0a0a0f]/40 border border-[rgba(30,79,163,0.08)] p-3">
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3 text-[#1E4FA3]" />
            <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[#f0f0f0]">{(stats.total_tokens_used / 1000).toFixed(1)}k</p>
          </div>
          <p className="text-[10px] text-[#5a5a6a]">Tokens Used</p>
        </div>
        <div className="rounded-xl bg-[#0a0a0f]/40 border border-[rgba(30,79,163,0.08)] p-3">
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-emerald-400" />
            <p className="text-lg font-bold font-[family-name:var(--font-display)] text-emerald-400">${stats.estimated_total_cost_usd.toFixed(3)}</p>
          </div>
          <p className="text-[10px] text-[#5a5a6a]">Est. Cost</p>
        </div>
      </div>
    </div>
  );
}
