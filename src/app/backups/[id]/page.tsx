"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getBackupPlanById, updateBackupPlan } from "@/lib/api";
import type { BackupPlan } from "@/types/backup";
import BackupScenarioCard from "@/components/backups/BackupScenarioCard";
import Button from "@/components/ui/Button";
import { ArrowLeft, XCircle } from "lucide-react";

export default function BackupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [plan, setPlan] = useState<BackupPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getBackupPlanById(id)
      .then((data) => { if (!cancelled) setPlan(data); })
      .catch(() => { if (!cancelled) router.push("/backups"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, router]);

  const handleCancel = useCallback(async () => {
    if (!plan || cancelling) return;
    if (!confirm("Cancel this backup plan? This action cannot be undone.")) return;
    setCancelling(true);
    try {
      const updated = await updateBackupPlan(plan.id, { status: "cancelled" });
      setPlan(updated);
    } catch (err) {
      console.error("Failed to cancel backup plan:", err);
    } finally {
      setCancelling(false);
    }
  }, [plan, cancelling]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  if (!plan) return null;

  const isCancelled = plan.status === "cancelled";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => router.push("/backups")} className="mb-6 flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Backup Plans
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">{plan.title || "Backup Career Plan"}</h1>
            {isCancelled && (
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">Cancelled</span>
            )}
          </div>
          {plan.description && <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>}
          <p className="mt-1 text-xs text-text-muted">Created {new Date(plan.created_at).toLocaleDateString()}</p>
        </div>
        {!isCancelled && (
          <Button variant="danger" size="sm" onClick={handleCancel} isLoading={cancelling}>
            <XCircle className="h-4 w-4 mr-1" /> Cancel Plan
          </Button>
        )}
      </div>

      {plan.scenarios.length > 0 ? (
        <div className="space-y-4">
          {plan.scenarios.map((scenario) => (
            <BackupScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-accent/15 bg-surface/15 p-12 text-center">
          <p className="text-sm text-text-secondary">This backup plan has no scenarios yet.</p>
        </div>
      )}
    </div>
  );
}
