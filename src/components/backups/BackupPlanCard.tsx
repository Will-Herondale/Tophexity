"use client";

import type { BackupPlan } from "@/types/backup";
import Card from "@/components/ui/Card";
import { Shield, ChevronRight, Calendar } from "lucide-react";

interface BackupPlanCardProps {
  plan: BackupPlan;
  onClick: (id: string) => void;
}

export default function BackupPlanCard({ plan, onClick }: BackupPlanCardProps) {
  return (
    <Card hover onClick={() => onClick(plan.id)} className="cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0]">
            {plan.title || "Backup Career Plan"}
          </h3>
          {plan.description && (
            <p className="mt-1 text-xs text-[#8a8a9a] line-clamp-2">{plan.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-[#5a5a6a]">
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
        <ChevronRight className="h-5 w-5 text-[#5a5a6a]" />
      </div>
    </Card>
  );
}
