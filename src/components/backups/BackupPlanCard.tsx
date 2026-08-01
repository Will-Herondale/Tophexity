"use client";

import type { BackupPlan } from "@/types/backup";
import Card from "@/components/ui/Card";
import { Shield, ChevronRight, Calendar } from "lucide-react";

interface BackupPlanCardProps {
  plan: BackupPlan;
  onClick: (id: string) => void;
}

export default function BackupPlanCard({ plan, onClick }: BackupPlanCardProps) {
  const isCancelled = plan.status === "cancelled";

  return (
    <Card hover={!isCancelled} onClick={() => !isCancelled && onClick(plan.id)} className={`cursor-pointer ${isCancelled ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-foreground">
              {plan.title || "Backup Career Plan"}
            </h3>
            {isCancelled && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                Cancelled
              </span>
            )}
          </div>
          {plan.description && (
            <p className="mt-1 text-xs text-text-secondary line-clamp-2">{plan.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(plan.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {plan.scenarios.length} scenario{plan.scenarios.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {!isCancelled && <ChevronRight className="h-5 w-5 text-text-muted" />}
      </div>
    </Card>
  );
}
