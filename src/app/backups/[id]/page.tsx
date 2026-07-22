"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getBackupPlanById } from "@/lib/api";
import type { BackupPlan } from "@/types/backup";
import BackupScenarioCard from "@/components/backups/BackupScenarioCard";
import { ArrowLeft } from "lucide-react";

export default function BackupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [plan, setPlan] = useState<BackupPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getBackupPlanById(id)
      .then((data) => { if (!cancelled) setPlan(data); })
      .catch(() => { if (!cancelled) router.push("/backups"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4FA3]/30 border-t-[#1E4FA3]" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.push("/backups")} className="mb-6 flex items-center gap-2 text-sm text-[#8a8a9a] hover:text-[#f0f0f0] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Backup Plans
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[#f0f0f0]">{plan.title || "Backup Career Plan"}</h1>
        {plan.description && <p className="mt-2 text-sm text-[#8a8a9a]">{plan.description}</p>}
        <p className="mt-1 text-xs text-[#5a5a6a]">Created {new Date(plan.created_at).toLocaleDateString()}</p>
      </div>

      {plan.scenarios.length > 0 ? (
        <div className="space-y-4">
          {plan.scenarios.map((scenario) => (
            <BackupScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-[rgba(30,79,163,0.15)] bg-[#0d214f]/30 p-12 text-center">
          <p className="text-sm text-[#8a8a9a]">This backup plan has no scenarios yet.</p>
        </div>
      )}
    </div>
  );
}
