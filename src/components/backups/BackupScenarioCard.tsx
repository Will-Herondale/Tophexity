"use client";

import type { BackupScenario } from "@/types/backup";
import Card from "@/components/ui/Card";
import { ArrowRight, Clock } from "lucide-react";

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  hard: "bg-red-500/10 text-red-400 border border-red-500/20",
};

interface BackupScenarioCardProps {
  scenario: BackupScenario;
}

export default function BackupScenarioCard({ scenario }: BackupScenarioCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">{scenario.scenario_name}</h4>
            {scenario.transition_difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[scenario.transition_difficulty] || "bg-surface text-text-secondary border border-border"}`}>
                {scenario.transition_difficulty}
              </span>
            )}
          </div>
          {scenario.career?.title && (
            <p className="mt-1 flex items-center gap-1 text-xs text-accent">
              <ArrowRight className="h-3 w-3" />
              {scenario.career.title}
            </p>
          )}
          {scenario.description && (
            <p className="mt-2 text-xs text-text-secondary">{scenario.description}</p>
          )}
          {scenario.reasoning && (
            <p className="mt-2 text-xs text-text-muted italic">&ldquo;{scenario.reasoning}&rdquo;</p>
          )}
          {scenario.estimated_transition_months && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted">
              <Clock className="h-3 w-3" /> ~{scenario.estimated_transition_months} months to transition
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
