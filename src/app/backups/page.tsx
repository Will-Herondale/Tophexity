"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBackupPlansHistory } from "@/lib/api";
import type { BackupPlan } from "@/types/backup";
import BackupPlanCard from "@/components/backups/BackupPlanCard";
import Button from "@/components/ui/Button";
import { Shield, RefreshCw } from "lucide-react";

export default function BackupsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<BackupPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    getBackupPlansHistory(page)
      .then((data) => { if (!cancelled) { setPlans(data.items); setTotalPages(data.total_pages); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-foreground">Backup Plans</h1>
          <p className="mt-1 text-sm text-text-secondary">Alternative career paths to keep your options open</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPage(page)}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface/30 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <Shield className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">No backup plans yet</h3>
          <p className="mt-2 text-sm text-text-secondary">Backup plans will appear here once the AI generates alternative career scenarios for you.</p>
          <Button className="mt-6" onClick={() => router.push("/careers")}>Explore Careers</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {plans.map((plan) => (
              <BackupPlanCard key={plan.id} plan={plan} onClick={(id) => router.push(`/backups/${id}`)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
