"use client";

import type { BackupScenario } from "@/types/backup";
import Card from "@/components/ui/Card";
import { ArrowRight, Clock } from "lucide-react";

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
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
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{scenario.scenario_name}</h4>
            {scenario.transition_difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[scenario.transition_difficulty] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                {scenario.transition_difficulty}
              </span>
            )}
          </div>
          {scenario.career?.title && (
            <p className="mt-1 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
              <ArrowRight className="h-3 w-3" />
              {scenario.career.title}
            </p>
          )}
          {scenario.description && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{scenario.description}</p>
          )}
          {scenario.reasoning && (
            <p className="mt-2 text-xs text-gray-400 italic dark:text-gray-500">&ldquo;{scenario.reasoning}&rdquo;</p>
          )}
          {scenario.estimated_transition_months && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="h-3 w-3" /> ~{scenario.estimated_transition_months} months to transition
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
